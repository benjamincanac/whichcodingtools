import { readdirSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { parse } from 'yaml'

/**
 * Reads content/tools at build time to:
 * - register a 301 for every alias slug (renamed tools keep their old URLs)
 * - list the detail pages and JSON API files for prerendering
 */
export default defineNuxtModule({
  meta: { name: 'tools' },
  setup(_, nuxt) {
    const dir = join(nuxt.options.rootDir, 'content/tools')
    const tools = readdirSync(dir)
      .filter(f => ['.yml', '.yaml'].includes(extname(f)))
      .map(f => parse(readFileSync(join(dir, f), 'utf8')) as { slug: string, aliases?: { slug: string }[] })

    const routeRules = nuxt.options.routeRules ??= {}
    for (const tool of tools) {
      for (const alias of tool.aliases ?? []) {
        routeRules[`/tools/${alias.slug}`] = { redirect: { to: `/tools/${tool.slug}`, statusCode: 301 } }
      }
    }

    nuxt.hook('prerender:routes', ({ routes }) => {
      routes.add('/api/tools.json')
      for (const tool of tools) {
        routes.add(`/tools/${tool.slug}`)
        routes.add(`/api/tools/${tool.slug}.json`)
      }
    })
  }
})
