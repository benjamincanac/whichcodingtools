export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@comark/nuxt',
    '@nuxtjs/seo'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_SITE_URL || 'https://whichcodingtools.vercel.app',
    name: 'whichcodingtools',
    description: 'An open, always-fresh directory of AI coding tools. Data in git, no affiliate links.'
  },

  routeRules: {
    '/': { prerender: true },
    '/tools/**': { prerender: true },
    '/compare/**': { prerender: true },
    '/plans/**': { prerender: true },
    '/layers/**': { prerender: true },
    '/changelog': { prerender: true },
    '/api/**': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: true
    }
  },

  linkChecker: {
    enabled: false
  },

  ogImage: {
    zeroRuntime: true,
    security: {
      // A few hundred images render during prerender, the default 15s is too tight under load.
      renderTimeout: 120_000
    }
  }
})
