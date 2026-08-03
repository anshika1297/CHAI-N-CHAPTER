/**
 * Environment variable validation for production
 * Ensures all required variables are set before starting the server
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  PUBLIC_SITE_URL?: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
];

export async function validateEnv(): Promise<void> {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // JWT_SECRET must be changed from default
    if (process.env.JWT_SECRET === 'dev-secret-change-in-production') {
      warnings.push('JWT_SECRET is using default value. Change it in production!');
    }

    // MONGODB_URI should not be localhost in production
    if (process.env.MONGODB_URI?.includes('localhost')) {
      warnings.push('MONGODB_URI points to localhost. Use a production database!');
    }

    // FRONTEND_URL should be HTTPS in production
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      warnings.push('FRONTEND_URL should use HTTPS in production');
    }

    // PUBLIC_SITE_URL should be set in production
    if (!process.env.PUBLIC_SITE_URL) {
      warnings.push('PUBLIC_SITE_URL is not set. Email links may not work correctly.');
    }
    if (process.env.ANNOUNCE_TEST_ONLY?.trim()) {
      warnings.push('ANNOUNCE_TEST_ONLY is set — remove it on production or announces will go to all subscribers only when NODE_ENV=production.');
    }
  }

  // Report errors
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  console.log('✅ Environment variables validated');
}
