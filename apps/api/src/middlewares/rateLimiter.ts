import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for subscription endpoints
 * Limits: 3 requests per hour per IP
 */
export const subscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 subscription requests per hour
  message: 'Too many subscription requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for contact/message endpoints
 * Limits: 5 requests per hour per IP
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 messages per hour
  message: 'Too many messages from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
