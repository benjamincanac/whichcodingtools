import { readdirSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { parse } from 'yaml'
import { BYOK, FEATURES, HOSTS, LAYERS, LICENSE_KINDS, PLANS, PLATFORMS, PROVIDERS, STATUSES, WRAP_VIA } from '../shared/enums'

const COLLECTIONS = ['simple-icons', 'lucide']

/** `i-simple-icons-apple` -> `simple-icons:apple`, the form the icon client bundle expects. */
function iconifyName(icon: string) {
  const bare = icon.replace(/^i-/, '')
  const collection = COLLECTIONS.find(c => bare.startsWith(`${c}-`))
  return collection ? `${collection}:${bare.slice(collection.length + 1)}` : bare
}

/**
 * Reads content/tools at build time to:
 * - register a 301 for every alias slug (renamed tools keep their old URLs)
 * - list the detail pages and JSON API files for prerendering
 * - bundle every icon the data and the enums reference, so the static site needs no icon API
 */
export default defineNuxtModule({
  meta: { name: 'tools' },
  setup(_, nuxt) {
    const dir = join(nuxt.options.rootDir, 'content/tools')
    const tools = readdirSync(dir)
      .filter(f => ['.yml', '.yaml'].includes(extname(f)))
      .map(f => parse(readFileSync(join(dir, f), 'utf8')) as { slug: string, layer: string, icon?: string, aliases?: { slug: string }[] })

    const routeRules = nuxt.options.routeRules ??= {}
    for (const tool of tools) {
      for (const alias of tool.aliases ?? []) {
        routeRules[`/tools/${alias.slug}`] = { redirect: { to: `/tools/${tool.slug}`, statusCode: 301 } }
      }
    }

    nuxt.hook('prerender:routes', ({ routes }) => {
      routes.add('/api/tools.json')
      routes.add('/api/changelog.json')
      routes.add('/changelog')
      routes.add('/compare')
      for (const layer of LAYERS) routes.add(`/layers/${layer.value}`)
      for (const plan of PLANS) routes.add(`/plans/${plan.value}`)
      for (const tool of tools) {
        routes.add(`/tools/${tool.slug}`)
        routes.add(`/api/tools/${tool.slug}.json`)
      }
      // One comparison page per pair of tools in the same primary layer.
      for (const a of tools) {
        for (const b of tools) {
          if (a.slug < b.slug && a.layer === b.layer) routes.add(`/compare/${a.slug}-vs-${b.slug}`)
        }
      }
    })

    nuxt.hook('icon:clientBundleIcons', (icons) => {
      const enums = [BYOK, FEATURES, HOSTS, LAYERS, LICENSE_KINDS, PLANS, PLATFORMS, PROVIDERS, STATUSES, WRAP_VIA]
      for (const option of enums.flat()) {
        if ('icon' in option && option.icon) icons.add(iconifyName(option.icon))
      }
      for (const tool of tools) {
        if (tool.icon) icons.add(iconifyName(tool.icon))
      }
    })
  }
})
