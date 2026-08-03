import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export type EmailSmtpSettings = {
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

export function formatSmtpError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; response?: string; responseCode?: number };
    const parts = [
      e.message,
      e.code ? `code ${e.code}` : '',
      e.responseCode ? `SMTP ${e.responseCode}` : '',
      e.response ? String(e.response).trim() : '',
    ].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  return err instanceof Error ? err.message : 'SMTP error';
}

export function isSmtpConfigured(settings: EmailSmtpSettings | null, env = config.smtp): boolean {
  const user = settings?.smtpUser?.trim() || env.user?.trim();
  const pass = settings?.smtpPass?.trim() || env.pass?.trim();
  const host = settings?.smtpHost?.trim() || env.host?.trim();
  return Boolean(host && user && pass);
}

/** Merge admin DB settings with optional overrides (e.g. unsaved form for test send). */
export function mergeEmailSmtpSettings(
  saved: EmailSmtpSettings | null,
  overrides?: Partial<EmailSmtpSettings> | null
): EmailSmtpSettings {
  if (!overrides) return saved ?? {};
  const merged: EmailSmtpSettings = { ...(saved ?? {}) };
  if (overrides.fromEmail !== undefined) merged.fromEmail = overrides.fromEmail;
  if (overrides.smtpHost !== undefined) merged.smtpHost = overrides.smtpHost;
  if (overrides.smtpPort !== undefined) merged.smtpPort = overrides.smtpPort;
  if (overrides.smtpSecure !== undefined) merged.smtpSecure = overrides.smtpSecure;
  if (overrides.smtpUser !== undefined) merged.smtpUser = overrides.smtpUser;
  if (overrides.smtpPass?.trim()) merged.smtpPass = overrides.smtpPass;
  return merged;
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function isValidEmail(addr: string): boolean {
  return EMAIL_RE.test(addr.trim());
}

function formatFrom(displayName: string, email: string): string {
  const name = displayName.trim() || 'Chapters.aur.Chai';
  const safeName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (/[,;@<>]/.test(name) || name.includes('"')) {
    return `"${safeName}" <${email}>`;
  }
  return `${name} <${email}>`;
}

/**
 * RFC 5322–safe From for nodemailer. Fixes admin typos like "Name (email@domain)" (parentheses).
 */
export function normalizeFromAddress(raw: string | undefined, fallbackEmail?: string): string {
  const fallback = (fallbackEmail || '').trim();
  let input = (raw || '').trim();

  if (!input) {
    if (fallback && isValidEmail(fallback)) return formatFrom('Chapters.aur.Chai', fallback);
    const envFrom = config.smtp.from?.trim();
    if (envFrom) return normalizeFromAddress(envFrom, fallback);
    throw new Error('From address is missing. Use: Chapters.aur.Chai <read@chaptersaurchai.com>');
  }

  // Common mistake: Chapters.aur.Chai (read@chaptersaurchai.com)
  const parenMatch = input.match(/^(.+?)\s*\(\s*([^)]+@[^)]+)\s*\)\s*$/);
  if (parenMatch) {
    input = `${parenMatch[1].trim()} <${parenMatch[2].trim()}>`;
  }

  const angleMatch = input.match(/^([^<]+?)<\s*([^>]+)\s*>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^["']|["']$/g, '');
    const addr = angleMatch[2].trim();
    if (isValidEmail(addr)) return formatFrom(name, addr);
  }

  if (isValidEmail(input)) return formatFrom('Chapters.aur.Chai', input);

  const embedded = input.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  if (embedded && isValidEmail(embedded[0])) {
    const name = input.replace(embedded[0], '').trim() || 'Chapters.aur.Chai';
    return formatFrom(name, embedded[0]);
  }

  if (fallback && isValidEmail(fallback)) return formatFrom('Chapters.aur.Chai', fallback);

  throw new Error(
    `Invalid From address "${raw}". Use angle brackets, not parentheses: Chapters.aur.Chai <read@chaptersaurchai.com>`
  );
}

export function resolveFromAddress(settings: EmailSmtpSettings | null, env = config.smtp): string {
  const smtpUser = settings?.smtpUser?.trim() || env.user?.trim();
  const raw = settings?.fromEmail?.trim() || smtpUser || env.from;
  return normalizeFromAddress(raw, smtpUser);
}

export function createSmtpTransporter(settings: EmailSmtpSettings | null, env = config.smtp) {
  const user = settings?.smtpUser?.trim() || env.user?.trim();
  const pass = settings?.smtpPass?.trim() || env.pass?.trim();
  const host = settings?.smtpHost?.trim() || env.host?.trim();
  if (!host) {
    throw new Error('SMTP host is missing. Set mail.chaptersaurchai.com in Admin → Subscriber emails (save first), or SMTP_HOST in apps/api/.env.');
  }
  if (!user || !pass) {
    throw new Error(
      'SMTP login is missing. Enter SMTP user and password in Admin, click Save, then send the test again (or set SMTP_USER and SMTP_PASS in apps/api/.env).'
    );
  }

  const port = settings?.smtpPort ?? env.port ?? 587;
  const secure = settings?.smtpSecure ?? env.secure ?? port === 465;

  const options = {
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  };

  return {
    transporter: nodemailer.createTransport(options),
    meta: { host, port, secure, user, from: resolveFromAddress(settings, env) },
  };
}

export async function verifySmtpConnection(settings: EmailSmtpSettings | null, env = config.smtp): Promise<void> {
  const { transporter, meta } = createSmtpTransporter(settings, env);
  try {
    await transporter.verify();
  } catch (err) {
    throw new Error(
      `SMTP connection failed (${meta.host}:${meta.port}, user ${meta.user}). ${formatSmtpError(err)}`
    );
  }
}
