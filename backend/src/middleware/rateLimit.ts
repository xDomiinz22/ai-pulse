import rateLimit from 'express-rate-limit'

// Global limiter — protects every endpoint against DDoS / abusive traffic.
// Checklist: "Limit requests (throttling) to avoid DDoS / brute force"
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                  // 300 requests per IP per window
  standardHeaders: true,     // RateLimit-* headers
  legacyHeaders: false,      // disable X-RateLimit-* (fingerprinting)
  message: { error: 'Too many requests, please try again later.' },
})

// Strict limiter for authentication endpoints — defends against brute-force
// credential stuffing. Checklist: "Use 'Max Retry' and jail features in login"
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // 10 attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts toward the limit
  message: { error: 'Too many authentication attempts, please try again later.' },
})

// Limiter for expensive write/trigger endpoints (e.g. scraper, voting).
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})
