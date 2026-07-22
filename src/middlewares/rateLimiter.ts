import rateLimit from 'express-rate-limit';

// Global rate limiter for auth routes (login, register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    data: {},
    errors: null,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for webhook endpoints to prevent abuse
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  message: {
    success: false,
    message: 'Too many webhook requests from this IP, please try again after a minute',
    data: {},
    errors: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
