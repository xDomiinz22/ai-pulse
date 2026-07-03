import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The Express backend runs as a separate Vercel service under /api (see
  // vercel.json). In local dev the frontend talks to it on :3001 directly via
  // the API base in src/lib/api.ts, so no rewrites are needed here.
  reactStrictMode: true,
}

export default nextConfig
