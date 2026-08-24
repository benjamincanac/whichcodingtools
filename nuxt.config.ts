export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@comark/nuxt',
    '@nuxtjs/seo',
    // The maintenance agent in agent/, deployed with the site (Vercel Cron, Sandbox, Workflow).
    'eve/nuxt'
  ],

  $production: {
    // Pages render on demand with ISR: they expire hourly so freshness badges keep aging,
    // and /api/revalidate purges them early when content is pushed.
    // Only GET data routes are cached: POST endpoints (revalidate, finder/parse) must stay plain functions.
    routeRules: {
      '/': { isr: 60 * 60 },
      // passQuery: without it the ISR function renders these pages with the query string stripped,
      // while the cache still keys on the full URL: the filtered client then hydrates against
      // unfiltered HTML and crashes. (/tools and /compare read route.query during SSR.)
      '/compare': { isr: { expiration: 60 * 60, passQuery: true } },
      '/compare/**': { isr: 60 * 60 },
      '/plans/**': { isr: 60 * 60 },
      '/layers/**': { isr: 60 * 60 },
      '/llms.txt': { isr: 60 * 60 },
      '/tools': { isr: { expiration: 60 * 60, passQuery: true } },
      '/tools/**': { isr: 60 * 60 },
      '/api/tools.json': { isr: 60 * 60 },
      '/api/tools/**': { isr: 60 * 60 },
      '/api/content/**': { isr: 60 * 60 },
      '/api/__sitemap__/urls': { isr: 60 * 60 },
      '/sitemap.xml': { isr: 60 * 60 }
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_SITE_URL || 'https://whichcoding.tools',
    name: 'whichcodingtools',
    description: 'An open, always-fresh directory of AI coding tools. Data in git, no affiliate links.',
    // Keep the site out of search until the domain switch, so Google never learns the vercel.app URL.
    indexable: false
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
    },
    public: {
      // Natural language finder, needs AI_GATEWAY_API_KEY (or Vercel OIDC) at runtime.
      finderAi: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL)
    }
  },

  experimental: {
    payloadExtraction: false
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
      // The default globs already cover the tool icons in content/tools YAML;
      // shared/enums.ts holds icons referenced nowhere else (platforms, hosts).
      scan: {
        globInclude: ['**/*.{vue,jsx,tsx,md,mdc,mdx,yml,yaml}', 'shared/**/*.ts']
      }
    }
  },

  linkChecker: {
    enabled: false
  },

  ogImage: {
    // Pages render on demand (ISR), so do their images.
    zeroRuntime: false
  },

  sitemap: {
    // Nothing is prerendered (ISR), so the module only discovers the static routes on its own.
    // Every data-driven page comes from this source: tools, layers, plans and the compare pairs
    // worth advertising.
    sources: ['/api/__sitemap__/urls']
  }
})
