/** @type {import('vinext').VinextConfig} */
const config = {
  experimental: {
    serverActions: true,
    typedRoutes: true,
  },
  cloudflare: {
    kv: true,
    runtime: 'edge',
    analyticsEngine: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default config
