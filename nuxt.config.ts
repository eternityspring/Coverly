// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false, // pure SPA — this is a client-side design editor
  devtools: { enabled: true },
  devServer: { port: 3009 },
  modules: ['@pinia/nuxt', '@nuxt/icon'],
  icon: { mode: 'svg', size: '1em' },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Coverly — DOM-native Cover & Card Editor',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        // SVG first for browsers that support it; the .ico is the fallback and
        // is also what shows up in bookmark bars and older browsers.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          // Only the UI typeface loads up front. Design fonts are fetched when a
          // document uses one or the font picker is opened — see utils/fontLoader.
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // The user system only exists when a database is configured. Baked in at
      // build time — the client uses it to decide whether to offer sign-in.
      authEnabled: !!process.env.DATABASE_URL,
      // Google sign-in additionally needs OAuth credentials; without them the
      // login page offers email + password only.
      googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  nitro: {
    preset: 'vercel',
  },
  vite: {
    optimizeDeps: {
      include: ['better-auth/vue'],
    },
  },
})
