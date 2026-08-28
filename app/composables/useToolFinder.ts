import type { LocationQuery, LocationQueryRaw } from 'vue-router'
// Not auto-imported by Nuxt UI (internal to SelectMenu/CommandPalette), but exported.
import { useFilter } from '@nuxt/ui/composables/useFilter'
import type { Feature, Host, Layer, Plan, Platform, Provider } from '#shared/enums'
import { FEATURE_VALUES, HOST_VALUES, LAYER_VALUES, PLAN_VALUES, PLATFORM_VALUES, PROVIDER_VALUES } from '#shared/enums'
import type { ToolSummary } from '#shared/types/tool'
import { EMPTY_REQUIREMENTS, deltaPrice, matchTool, requirementCount, type MatchResult, type Requirements } from '#shared/utils/match'

export type SortKey = 'match' | 'name' | 'verified' | 'price'

export interface ToolMatch {
  tool: ToolSummary
  match: MatchResult
}

const LIST_KEYS = {
  where: LAYER_VALUES,
  hosts: HOST_VALUES,
  platforms: PLATFORM_VALUES,
  plans: PLAN_VALUES,
  providers: PROVIDER_VALUES,
  features: FEATURE_VALUES
} as const

const BOOL_KEYS = ['local', 'byok', 'free', 'oss'] as const

function list<T extends string>(value: LocationQuery[string] | undefined, allowed: readonly string[]): T[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '')
  return raw.split(',').filter(v => allowed.includes(v)) as T[]
}

function fromQuery(query: LocationQuery): Requirements {
  return {
    q: typeof query.q === 'string' ? query.q : '',
    where: list<Layer>(query.where, LIST_KEYS.where),
    hosts: list<Host>(query.hosts, LIST_KEYS.hosts),
    platforms: list<Platform>(query.platforms, LIST_KEYS.platforms),
    plans: list<Plan>(query.plans, LIST_KEYS.plans),
    providers: list<Provider>(query.providers, LIST_KEYS.providers),
    features: list<Feature>(query.features, LIST_KEYS.features),
    local: query.local === '1',
    byok: query.byok === '1',
    free: query.free === '1',
    oss: query.oss === '1',
    budget: typeof query.budget === 'string' && query.budget !== '' ? Number(query.budget) : null
  }
}

export function toQuery(req: Requirements, sort: SortKey = 'match'): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  if (req.q) query.q = req.q
  for (const key of Object.keys(LIST_KEYS) as (keyof typeof LIST_KEYS)[]) {
    if (req[key].length) query[key] = req[key].join(',')
  }
  for (const key of BOOL_KEYS) {
    if (req[key]) query[key] = '1'
  }
  if (req.budget !== null) query.budget = String(req.budget)
  if (sort !== 'match') query.sort = sort
  return query
}

export function useToolFinder() {
  const route = useRoute()
  const router = useRouter()
  const { tools, bySlug, status, ready } = useTools()

  const requirements = computed<Requirements>({
    get: () => fromQuery(route.query),
    set: value => router.replace({ query: toQuery(value, sort.value) })
  })

  const sort = computed<SortKey>({
    get: () => (['match', 'name', 'verified', 'price'].includes(String(route.query.sort)) ? route.query.sort as SortKey : 'match'),
    set: value => router.replace({ query: toQuery(requirements.value, value) })
  })

  function update<K extends keyof Requirements>(key: K, value: Requirements[K]) {
    requirements.value = { ...requirements.value, [key]: value }
  }

  function reset() {
    requirements.value = { ...EMPTY_REQUIREMENTS }
  }

  const count = computed(() => requirementCount(requirements.value))

  /** Nothing asked for and nothing searched: the listing has no signal to rank on. */
  const plain = computed(() => count.value === 0 && !requirements.value.q.trim())

  const { scoreItem } = useFilter()

  /**
   * Lower is better, null is no match at all. Identity only: descriptions name other products
   * constantly, so searching them puts every wrapper that runs Claude Code under "claude".
   */
  function relevanceOf(tool: ToolSummary, q: string) {
    const name = scoreItem(tool, q, ['name', 'slug'])
    if (name !== null) return name
    const vendor = scoreItem(tool, q, ['vendor'])
    return vendor === null ? null : 3 + vendor
  }

  const searched = computed(() => {
    const q = requirements.value.q.trim()
    const relevance = new Map<string, number>()
    if (!q) return { items: tools.value, relevance }
    const items: ToolSummary[] = []
    for (const tool of tools.value) {
      const score = relevanceOf(tool, q)
      if (score === null) continue
      relevance.set(tool.slug, score)
      items.push(tool)
    }
    return { items, relevance }
  })

  const matches = computed<ToolMatch[]>(() => {
    const req = requirements.value
    const items = searched.value.items.map(tool => ({ tool, match: matchTool(tool, req, bySlug.value) }))
    const price = (m: ToolMatch) => deltaPrice(m.match) ?? m.tool.entry_price ?? Number.POSITIVE_INFINITY
    const rank = (m: ToolMatch) => searched.value.relevance.get(m.tool.slug) ?? 0
    const name = (a: ToolMatch, b: ToolMatch) => a.tool.name.localeCompare(b.tool.name)
    const sorters: Record<SortKey, (a: ToolMatch, b: ToolMatch) => number> = {
      // "Best match" against nothing leaves every key tied: 66 of 77 tools start at $0, so price
      // ties too and freshness used to break it, which put whatever the last sweep touched on
      // top. Unfiltered the page groups by layer instead, and this orders inside the group.
      match: plain.value
        ? name
        : (a, b) => a.match.missing.length - b.match.missing.length || rank(a) - rank(b) || price(a) - price(b) || b.tool.freshness.verified_at.localeCompare(a.tool.freshness.verified_at) || name(a, b),
      name,
      verified: (a, b) => b.tool.freshness.verified_at.localeCompare(a.tool.freshness.verified_at) || name(a, b),
      price: (a, b) => price(a) - price(b) || name(a, b)
    }
    return items.sort(sorters[sort.value])
  })

  const exact = computed(() => matches.value.filter(m => m.match.missing.length === 0))
  /** A near miss is one or two requirements short, but never "missed everything you asked for". */
  const closeLimit = computed(() => Math.min(2, count.value - 1))
  const close = computed(() => matches.value.filter(m => m.match.missing.length > 0 && m.match.missing.length <= closeLimit.value))
  const hidden = computed(() => matches.value.length - exact.value.length - close.value.length)

  return { tools, status, ready, requirements, sort, update, reset, count, plain, matches, exact, close, hidden }
}
