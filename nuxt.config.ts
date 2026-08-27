import { createRequire } from 'node:module'

// satori loads harfbuzz's wasm from a runtime `__dirname` path, so node-file-trace never sees it
// and the Vercel function ships hb.js without hb.wasm. harfbuzzjs is satori's dependency, not ours,
// so it only resolves from there.
const harfbuzzWasm = createRequire(createRequire(import.meta.url).resolve('satori')).resolve('harfbuzzjs/hb.wasm')

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@comark/nuxt',
    '@nuxtjs/seo',
    '@vercel/analytics',
    '@vercel/speed-insights',
    'nuxt-llms',
    // Markdown twins under /raw/**, content negotiation for AI agents, /sitemap.md and the
    // api-catalog. Owns /llms.txt through its nuxt-llms bridge.
    'nuxt-agent-discovery',
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
      '/api/compare.json': { isr: 60 * 60 },
      '/api/tools/**': { isr: 60 * 60 },
      '/api/content/**': { isr: 60 * 60 },
      '/api/__sitemap__/urls': { isr: 60 * 60 },
      '/sitemap.xml': { isr: 60 * 60 },
      // The agent surfaces. Safe to cache: a `.md` URL has one representation, so unlike a page
      // there is no second variant a path-keyed cache could overwrite.
      '/raw/**': { isr: 60 * 60 },
      '/sitemap.md': { isr: 60 * 60 },
      '/llms-full.txt': { isr: 60 * 60 }
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_SITE_URL || 'https://whichcoding.tools',
    name: 'whichcoding.tools',
    description: 'An open, always-fresh directory of AI coding tools. Data in git, no affiliate links.'
  },

  ui: {
    experimental: {
      componentDetection: true
    }
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
    externals: {
      traceInclude: [harfbuzzWasm]
    },
    prerender: {
      // `nuxt-llms` registers both of these as prerender routes. Nothing on this site is
      // prerendered on purpose: `vercel.json` skips the build for content-only commits and
      // /api/revalidate purges ISR instead, so a static llms.txt would freeze at deploy time
      // with no way for the webhook to refresh it.
      ignore: ['/llms.txt', '/llms-full.txt']
    },
    vercel: {
      config: {
        // Lets /api/revalidate purge ISR pages with `x-prerender-revalidate`.
        bypassToken: process.env.VERCEL_BYPASS_TOKEN
      }
    }
  },

  agentDiscovery: {
    siteName: 'whichcoding.tools',
    // Not `createComarkSource()`: the content files are pure YAML with no body, and four of the
    // page types are computed and have no file at all. `server/markdown/` renders them instead.
    source: '~~/server/utils/agent-source',
    // Enumerated rather than '/**', and deliberately the same patterns as the ISR route rules
    // above. The module reads those rules to decide which patterns get a CDN 307 instead of a
    // rewrite, and a pattern that only half-overlaps a rule gets a duplicate pair of routes.
    // The query is not preserved on the twins of /tools and /compare, which is fine: their
    // markdown ignores the query and an agent that wants it filtered has /api/tools.json.
    routes: ['/', '/tools', '/tools/**', '/compare', '/compare/**', '/layers/**', '/plans/**'],
    sitemap: {
      markdown: { labels: { tools: 'Tools', compare: 'Comparisons', layers: 'Layers', plans: 'Plans' } }
    },
    discovery: {
      links: [
        { href: '/api/tools.json', rel: 'service-desc', type: 'application/json', anchor: '/api', title: 'Every tool as one JSON document' }
      ]
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

  llms: {
    domain: process.env.NUXT_SITE_URL || 'https://whichcoding.tools',
    title: 'whichcoding.tools',
    description: 'An open, always-fresh directory of AI coding tools. Data in git, no affiliate links.',
    // Only links that are not pages. A page link here would satisfy the bridge's "has page
    // links" check and suppress the content source's whole listing.
    sections: [
      {
        title: 'Data',
        links: [
          { title: 'API, every tool', description: 'The same records the site renders, as one JSON document.', href: '/api/tools.json' },
          { title: 'API, every comparison', description: 'The canonical pair list: both slugs and the URL. Comparisons are not enumerated in this file.', href: '/api/compare.json' },
          { title: 'Changelog, every data commit', href: 'https://github.com/benjamincanac/whichcodingtools/commits/main/content/tools' }
        ]
      }
    ],
    notes: [
      'Data is one YAML file per tool in git, validated against a schema, every fact with a source URL and the date it was verified.',
      'No affiliate links, no benchmarks, no LLM-written descriptions.'
    ],
    full: {
      title: 'Complete directory',
      description: 'Every tool page, layer page and plan page as one document. Comparisons are excluded, there are over 500 of them.'
    }
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
