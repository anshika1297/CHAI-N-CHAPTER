import '../loadEnv.js';

const PRODUCTION_SITE = 'https://chaptersaurchai.com';

const frontendUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000';

function resolvePublicSiteUrl(): string {
  const explicit = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit?.trim()) return explicit.trim().replace(/\/$/, '');

  const fe = frontendUrl.replace(/\/$/, '');
  const isLocalFrontend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fe);
  if (isLocalFrontend) return PRODUCTION_SITE;

  return fe || PRODUCTION_SITE;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  frontendUrl,
  /** Public URL for links in emails (images, unsubscribe). Defaults to live site when FRONTEND_URL is localhost. */
  publicSiteUrl: resolvePublicSiteUrl(),
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  /** SMTP for welcome emails. If any of host/user/pass is missing, welcome email is skipped. */
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.FROM_EMAIL || 'Chapters.aur.Chai <noreply@localhost>',
  },
  /** Logging configuration */
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  /**
   * Optional AI for Library OS. Multiple providers; tried in `order` with cooldown
   * on 429/401/403. Unset keys are skipped. No keys → heuristic-only search.
   *
   * Env keys: GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY,
   *           DEEPSEEK_API_KEY, MISTRAL_API_KEY, CEREBRAS_API_KEY
   * Optional models: *_MODEL (e.g. OPENROUTER_MODEL)
   * Order: AI_PROVIDER_ORDER (default gemini,groq,openrouter,deepseek,cerebras,mistral,openai)
   */
  ai: {
    order: (
      process.env.AI_PROVIDER_ORDER ||
      // Default = free / free-tier only. Paid providers still work if you add keys + list them.
      'gemini,groq,openrouter,cerebras'
    )
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    gemini: {
      apiKey: (process.env.GEMINI_API_KEY || '').trim(),
      model: (process.env.GEMINI_MODEL || '').trim(),
    },
    groq: {
      apiKey: (process.env.GROQ_API_KEY || '').trim(),
      model: (process.env.GROQ_MODEL || '').trim(),
    },
    openai: {
      apiKey: (process.env.OPENAI_API_KEY || '').trim(),
      model: (process.env.OPENAI_MODEL || '').trim(),
    },
    openrouter: {
      apiKey: (process.env.OPENROUTER_API_KEY || '').trim(),
      model: (process.env.OPENROUTER_MODEL || '').trim(),
    },
    deepseek: {
      apiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
      model: (process.env.DEEPSEEK_MODEL || '').trim(),
    },
    mistral: {
      apiKey: (process.env.MISTRAL_API_KEY || '').trim(),
      model: (process.env.MISTRAL_MODEL || '').trim(),
    },
    cerebras: {
      apiKey: (process.env.CEREBRAS_API_KEY || '').trim(),
      model: (process.env.CEREBRAS_MODEL || '').trim(),
    },
  },
};
