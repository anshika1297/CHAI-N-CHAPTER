import { config } from '../config/index.js';

export type ProviderName =
  | 'gemini'
  | 'groq'
  | 'openai'
  | 'openrouter'
  | 'deepseek'
  | 'mistral'
  | 'cerebras';

const ALL_PROVIDERS: ProviderName[] = [
  'gemini',
  'groq',
  'openai',
  'openrouter',
  'deepseek',
  'mistral',
  'cerebras',
];

type CompatibleEndpoint = {
  baseUrl: string;
  defaultModel: string;
  /** Extra headers (e.g. OpenRouter ranking). */
  headers?: Record<string, string>;
};

const COMPAT: Partial<Record<ProviderName, CompatibleEndpoint>> = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    // 8B has much higher free-tier RPM than 70B (which 429s quickly).
    defaultModel: 'llama-3.1-8b-instant',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    // Auto-picks a working free model (specific :free slugs rotate / go paid).
    defaultModel: 'openrouter/free',
    headers: {
      'HTTP-Referer': 'https://chaptersaurchai.com',
      'X-Title': 'ChaptersAurChai Library OS',
    },
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
  },
  cerebras: {
    baseUrl: 'https://api.cerebras.ai/v1',
    // Public catalog (llama-3.3-70b was removed).
    defaultModel: 'gpt-oss-120b',
  },
};

function providerConfig(provider: string): { apiKey: string; model: string } | null {
  if (!ALL_PROVIDERS.includes(provider as ProviderName)) return null;
  const cfg = config.ai[provider as ProviderName];
  return cfg ?? null;
}

/** Providers that have a key configured, in the configured fallback order. */
export function configuredProviders(): ProviderName[] {
  const seen = new Set<string>();
  const out: ProviderName[] = [];
  for (const name of config.ai.order) {
    if (seen.has(name)) continue;
    seen.add(name);
    const cfg = providerConfig(name);
    if (cfg?.apiKey) out.push(name as ProviderName);
  }
  return out;
}

export function aiEnabled(): boolean {
  return configuredProviders().length > 0;
}

function defaultModel(provider: ProviderName): string {
  if (provider === 'gemini') return 'gemini-flash-latest';
  return COMPAT[provider]?.defaultModel ?? '';
}

/** Skip a provider after hard failures so we don't burn every key on each request. */
const COOLDOWN_MS: Record<string, number> = {
  '429': 15 * 60 * 1000,
  '401': 60 * 60 * 1000,
  '403': 60 * 60 * 1000,
};
const providerCooldownUntil = new Map<ProviderName, number>();
const providerLastError = new Map<ProviderName, string>();

function isCoolingDown(provider: ProviderName): boolean {
  const until = providerCooldownUntil.get(provider) ?? 0;
  return Date.now() < until;
}

function markCooldown(provider: ProviderName, message: string): void {
  // Model-not-found / gone free should not lock the provider for 15m —
  // fixing *_MODEL in .env should work on the next request.
  if (/\b404\b/.test(message) || /model (does not exist|not found|unavailable)/i.test(message)) {
    providerLastError.set(provider, message);
    return;
  }
  const code = /\b(429|401|403)\b/.exec(message)?.[1];
  if (!code) return;
  const ms = COOLDOWN_MS[code] ?? 0;
  if (!ms) return;
  providerCooldownUntil.set(provider, Date.now() + ms);
  providerLastError.set(provider, message);
  console.warn(
    `aiClient: cooling down ${provider} for ${Math.round(ms / 60000)}m after: ${message.slice(0, 120)}`
  );
}

/** For /health — no secrets. */
export function aiProviderStatus(): {
  enabled: boolean;
  providers: ProviderName[];
  available: ProviderName[];
  cooldown: { provider: ProviderName; secondsLeft: number; reason: string }[];
} {
  const providers = configuredProviders();
  const now = Date.now();
  const cooldown = providers
    .map((p) => {
      const until = providerCooldownUntil.get(p) ?? 0;
      const secondsLeft = Math.max(0, Math.ceil((until - now) / 1000));
      if (secondsLeft <= 0) return null;
      return {
        provider: p,
        secondsLeft,
        reason: providerLastError.get(p) || 'rate limited',
      };
    })
    .filter(Boolean) as { provider: ProviderName; secondsLeft: number; reason: string }[];

  return {
    enabled: providers.length > 0,
    providers,
    available: providers.filter((p) => !isCoolingDown(p)),
    cooldown,
  };
}

async function callGemini(
  prompt: string,
  model: string,
  apiKey: string,
  temperature = 0,
  timeoutMs = 12000
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAiCompatible(
  prompt: string,
  model: string,
  baseUrl: string,
  apiKey: string,
  temperature = 0,
  timeoutMs = 20000,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${baseUrl} ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callProvider(
  provider: ProviderName,
  prompt: string,
  apiKey: string,
  model: string,
  opts: { temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  const temperature = opts.temperature ?? 0;
  const timeoutMs = opts.timeoutMs;
  if (provider === 'gemini') {
    return callGemini(prompt, model, apiKey, temperature, timeoutMs ?? 12000);
  }
  const endpoint = COMPAT[provider];
  if (!endpoint) throw new Error(`Unknown provider: ${provider}`);
  return callOpenAiCompatible(
    prompt,
    model,
    endpoint.baseUrl,
    apiKey,
    temperature,
    timeoutMs ?? 20000,
    endpoint.headers
  );
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstObj = trimmed.indexOf('{');
    const firstArr = trimmed.indexOf('[');
    const start =
      firstArr >= 0 && (firstArr < firstObj || firstObj < 0) ? firstArr : firstObj;
    const openChar = trimmed[start];
    const closeChar = openChar === '[' ? ']' : '}';
    const end = trimmed.lastIndexOf(closeChar);
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface AiAttemptError {
  provider: string;
  message: string;
}

export interface AiJsonResult<T> {
  data: T | null;
  provider: ProviderName | null;
  /** Per-provider failures, in the order they were tried (for diagnostics). */
  errors: AiAttemptError[];
}

function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'TimeoutError') return 'timed out';
  if (err instanceof Error) {
    const m = err.message || 'unknown error';
    const short = m.replace(/\s+/g, ' ').trim().slice(0, 180);
    if (/\b429\b/.test(short)) return `rate limit / quota exceeded (${short})`;
    if (/\b503\b/.test(short)) return `service overloaded (${short})`;
    return short;
  }
  return 'unknown error';
}

/**
 * Run a prompt through configured providers (fallback order + cooldown).
 */
export async function aiJson<T = unknown>(
  prompt: string,
  opts: { temperature?: number; timeoutMs?: number } = {}
): Promise<AiJsonResult<T>> {
  const providers = configuredProviders();
  const errors: AiAttemptError[] = [];

  for (const provider of providers) {
    if (isCoolingDown(provider)) {
      const until = providerCooldownUntil.get(provider) ?? 0;
      const mins = Math.max(1, Math.ceil((until - Date.now()) / 60000));
      errors.push({
        provider,
        message: `in cooldown (~${mins}m) — ${providerLastError.get(provider) || 'recent failure'}`,
      });
      continue;
    }
    const cfg = providerConfig(provider);
    if (!cfg?.apiKey) continue;
    const model = cfg.model || defaultModel(provider);
    if (!model) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      const text = await callProvider(provider, prompt, cfg.apiKey, model, opts);
      const parsed = extractJson(text);
      if (parsed == null) {
        errors.push({ provider, message: 'returned an unparseable response' });
        continue;
      }
      return { data: parsed as T, provider, errors };
    } catch (err) {
      const message = describeError(err);
      errors.push({ provider, message });
      markCooldown(provider, message);
      console.error(`aiJson: ${provider} failed (${message}), trying next provider`);
    }
  }

  if (providers.length === 0) errors.push({ provider: 'none', message: 'no AI provider configured' });
  return { data: null, provider: null, errors };
}
