// Centralized, validated configuration. Fails fast at startup if a required
// secret is missing or insecure — prevents shipping with placeholder secrets.

const PLACEHOLDER_SECRETS = [
  'cambia_esto_por_un_secreto_largo_y_aleatorio',
  'secret',
  'changeme',
  'your-secret-here',
]

function requireSecret(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[config] Missing required env var: ${name}`)
  }
  if (value.length < 32) {
    throw new Error(`[config] ${name} is too short — use at least 32 random characters`)
  }
  if (PLACEHOLDER_SECRETS.includes(value)) {
    throw new Error(`[config] ${name} is still set to a placeholder value — generate a real secret`)
  }
  return value
}

export const config = {
  port: process.env.PORT || 3001,
  isProd: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5177',
  jwtSecret: requireSecret('JWT_SECRET', process.env.JWT_SECRET),
  // Checklist: "Make token expiration (TTL, RTTL) as short as possible".
  // Configurable; defaults to a practical 1 day (no refresh-token flow yet).
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtAlgorithm: 'HS256' as const,
  // Google OAuth Client ID — used to verify the audience of Google ID tokens.
  // Optional: if unset, the /api/auth/google endpoint returns 503.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
}
