/**
 * Environment variable validation and configuration
 * Ensures required variables are set before build/runtime
 */

interface EnvConfig {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
}

/**
 * Validate environment variables
 * Called at build time and runtime
 */
export function validateEnv(): void {
  const warnings: string[] = [];

  // Check required variables
  if (!process.env.NEXT_PUBLIC_API_URL) {
    warnings.push('NEXT_PUBLIC_API_URL is not set. API calls may fail.');
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
    warnings.push('NEXT_PUBLIC_SITE_URL is not set. SEO and social sharing may not work correctly.');
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // API URL should be HTTPS in production
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_API_URL should use HTTPS in production');
    }

    // Site URL should be HTTPS in production
    if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_SITE_URL should use HTTPS in production');
    }
  }

  // Log warnings (only in development or if critical)
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }
}

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): Required<Pick<EnvConfig, 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_SITE_URL'>> & Pick<EnvConfig, 'NODE_ENV'> {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

// Validate on module load (runs at build time and runtime)
if (typeof window === 'undefined') {
  // Server-side validation
  validateEnv();
}
