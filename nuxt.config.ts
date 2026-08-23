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
    url: process.env.NUXT_SITE_URL || 'http://localhost:3000',
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

  ogImage: {
    zeroRuntime: true,
    fonts: ['Geist:400', 'Geist:500', 'Geist+Mono:500']
  },

  linkChecker: {
    enabled: false
  }
})
