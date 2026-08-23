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

  runtimeConfig: {
    // NUXT_GITHUB_TOKEN, NUXT_WEBHOOK_SECRET, NUXT_BYPASS_TOKEN (or the unprefixed env vars)
    githubToken: '',
    webhookSecret: '',
    bypassToken: '',
    github: {
      repo: 'benjamincanac/whichcodingtools',
      branch: 'main',
      contentDir: 'content/tools'
    }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    vercel: {
      config: {
        // Lets /api/revalidate purge ISR pages with `x-prerender-revalidate`.
        bypassToken: process.env.VERCEL_BYPASS_TOKEN
      }
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
    // Pages render on demand (ISR), so do their images.
    zeroRuntime: false
  }
})
