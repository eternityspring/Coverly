// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false, // pure SPA — this is a client-side design editor
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/icon'],
  icon: { mode: 'svg', size: '1em' },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Coverly — DOM-native Cover & Card Editor',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Serif+SC:wght@400;600;700;900&family=Poppins:wght@400;600;800&family=Playfair+Display:wght@500;700;900&family=Bebas+Neue&family=Pacifico&family=Roboto+Mono:wght@400;700&display=swap',
        },
      ],
    },
  },
})
