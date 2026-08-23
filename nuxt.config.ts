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
    url: process.env.NUXT_SITE_URL || 'https://codingagents.vercel.app',
    name: 'codingagents',
    description: 'An open, always-fresh directory of AI coding tools. Data in git, no affiliate links.'
  },

  routeRules: {
    '/': { prerender: true },
    '/tools/**': { prerender: true },
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
    zeroRuntime: true
  }
})
