import type { EnumOption, Layer, Plan } from '../enums'
import { FEATURES, HOSTS, LAYERS, LICENSE_KINDS, PLANS, PLATFORMS, STATUSES, lowerLabel, optionLabel, optionLabelLower } from '../enums'
import type { ToolSummary } from '../types/tool'
import { articleFor } from '../utils/text'

/**
 * Hand-written intros for the generated pages. Kept out of the enums so the
 * schema file stays short. Edit freely, this is prose, not data.
 */
export const LAYER_INTROS: Record<Layer, string> = {
  'harness': 'Terminal agents are the engines. They read the repo, edit files and run commands from your shell, and most of the other layers are ways to host one. Pricing usually comes from the vendor plan you sign in with, so the question is less what the tool costs and more which plan it needs.',
  'editor': 'AI-native editors ship the agent inside the editor. Most are VS Code forks, a few are written from scratch. They tend to sell their own plans with included usage and an overage rate, which is where the compare table earns its keep.',
  'extension': 'Extensions install into the editor you already use. They are the cheapest way to try a new model or provider, many are open source and bring your own key, and the host editor matters more than the operating system.',
  'app': 'First-party desktop apps bundle a vendor\'s own agent with a GUI: side by side sessions, visual diffs, scheduled tasks. They reuse the subscription the agent already needs, so they rarely add a bill.',
  'orchestrator': 'Orchestrators sit on top of terminal agents and run several at once, usually one git worktree per task. Most of them reuse the login of the agent they run, which is why "what does this cost on top of my Claude plan" is so often zero.',
  'cloud': 'Cloud agents work on your repository from a hosted sandbox, triggered from a ticket, a chat message or a web app. They bill by compute units or tasks rather than by seat, and the platform is the browser.',
  'app-builder': 'App builders turn a prompt into a deployed app. They are adjacent to coding tools rather than part of the set, included here because people compare them, with pricing that is almost always credit based.'
}

export const PLAN_INTROS: Record<Plan, string> = {
  claude: 'A Claude Pro, Max or Team subscription includes Claude Code. Anything that runs the Claude Code binary with your login, an orchestrator, an editor over ACP, the desktop app, costs nothing extra for model usage. Tools that call the Anthropic API with a key bill separately.',
  chatgpt: 'Every ChatGPT plan from Free up includes Codex, with usage shared in one five-hour window. Tools that run the Codex CLI with your ChatGPT login reuse that allowance. Some tools sign in with a ChatGPT account directly without being part of the plan.',
  copilot: 'GitHub Copilot plans carry a monthly credit allowance used by the editor extension, the CLI and the cloud coding agent. Tools that host Copilot over ACP reuse it.',
  cursor: 'Cursor plans include agent usage priced at model API rates. Orchestrators that drive the Cursor CLI agent reuse your Cursor account and its limits.',
  gemini: 'Google AI Pro and Ultra raise the Gemini CLI allowance above the free personal tier. Tools that run Gemini CLI with your Google account inherit that.',
  grok: 'SuperGrok plans give OAuth access to xAI models. A few terminal agents can sign in with that account instead of an API key.'
}

/* -------------------------------- headings -------------------------------- */

/**
 * What each generated page calls itself. One home, because a page now has two
 * renderings: the Vue page and its markdown twin, and a listing that names them
 * has to agree with both.
 */

export const TOOLS_INDEX = {
  title: 'Every AI coding tool, filtered by how you work',
  description: 'Editors, terminal agents, orchestrators and cloud agents. Filter by platform, the plan you already pay for, models, budget and features. Pricing verified against vendor pages.'
}

export const COMPARE_INDEX = {
  title: 'Compare AI coding tools',
  description: 'Side by side pricing, included usage, overage, BYOK, platforms, features and integrations for any AI coding tools, from vendor-verified data.'
}

export function toolPageTitle(tool: Pick<ToolSummary, 'name'>) {
  return `${tool.name} pricing, platforms and integrations`
}

export function layerPageTitle(layer: EnumOption) {
  return `${layer.label}s compared`
}

/** The heading over the tools that ship this layer as a second form. */
export function layerSecondaryTitle(layer: EnumOption) {
  return `Also available as ${articleFor(layer.label)}`
}

export const LAYER_SECONDARY_INTRO = 'Products whose primary form is something else but ship one of these too.'

export function planPageTitle(plan: EnumOption) {
  return `What you can use with a ${plan.label} subscription`
}

/** The three ways a tool can reach a plan, in the order the page lists them. */
export const PLAN_GROUPS = [
  { key: 'included', title: 'Part of the plan', description: 'No extra bill, it is what you are paying for.' },
  { key: 'signin', title: 'Signs in with it', description: 'Separate products that accept this account for model access.' },
  { key: 'wraps', title: 'Runs a tool on this plan', description: 'Hosts and orchestrators that reuse the login of a tool included in the plan. The chip is what they cost on top.' }
] as const

export function pairPageTitle(a: Pick<ToolSummary, 'name'>, b: Pick<ToolSummary, 'name'>) {
  return `${a.name} vs ${b.name}`
}

/* ------------------------- comparison descriptions ------------------------- */

/**
 * The meta description of a comparison page.
 *
 * Five hundred and fifty-seven pages carrying one identical sentence is the thin-content
 * signature search engines use to classify a site as a content farm, which is the exact thing
 * this directory is positioned against. A crawler cannot tell that the data underneath is
 * better than an affiliate site's, it sees the sentence.
 *
 * So every pair says what the two products are, then one thing that actually differs, picked by
 * the first rule in `pairDelta` that fires. Every clause reads a field the schema guarantees or
 * a value `shared/utils/` computes, which means `pnpm validate` passing is the same check that
 * keeps these sentences true. Nothing infers, nothing is written by a model.
 *
 * Kept near 160 characters, which is what a search result shows before it truncates.
 */
export function pairPageDescription(a: ToolSummary, b: ToolSummary, now = new Date()): string {
  const delta = pairDelta(a, b, now)
  return delta ? `${pairIdentity(a, b)} ${delta}` : pairIdentity(a, b)
}

/** What the two things are. Always emitted, so no pair falls back to boilerplate. */
function pairIdentity(a: ToolSummary, b: ToolSummary): string {
  const layer = (t: ToolSummary) => optionLabelLower(LAYERS, t.layer)
  return a.layer === b.layer
    ? `${a.name} and ${b.name} are both ${layer(a)}s.`
    : `${a.name} is ${articleFor(optionLabel(LAYERS, a.layer))}, ${b.name} is ${articleFor(optionLabel(LAYERS, b.layer))}.`
}

/**
 * How a tool's cost reads mid-sentence.
 *
 * `has_free_tier` means one tier costs nothing, not that the product is free: Cursor has a free
 * tier. Only `pricing_model: free` is the whole product, and even then every such tool in the
 * corpus is bring-your-own-key, so it is never "free to run".
 */
function priceClause(t: ToolSummary): string {
  if (t.entry_price === null) return t.pricing_model === 'usage' ? 'is usage-based' : 'is contact-sales only'
  if (t.entry_price > 0) return `starts at $${t.entry_price}/mo`
  return t.pricing_model === 'free' ? 'is free to install' : 'has a free tier'
}

/**
 * A sunset date is not always in the past. Amazon Q Developer carries an end-of-support date
 * eight months out, and "was discontinued in April 2027" is a confidently false sentence.
 */
function sunsetClause(t: ToolSummary, now: Date): string {
  if (!t.sunset_at) return 'is discontinued'
  const when = new Date(`${t.sunset_at}T00:00:00Z`)
  const month = when.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return when.getTime() > now.getTime() ? `loses support in ${month}` : `was discontinued in ${month}`
}

/** The first value in declaration order that one tool has and the other does not. */
function firstExtra<T extends string>(options: readonly EnumOption<T>[], mine: readonly T[], theirs: readonly T[]): EnumOption<T> | undefined {
  return options.find(o => mine.includes(o.value) && !theirs.includes(o.value))
}

/** The `wraps` edge between the two, in whichever direction it exists. */
function wrapEdge(a: ToolSummary, b: ToolSummary) {
  const ab = a.wraps.find(w => w.tool === b.slug)
  if (ab) return { host: a, guest: b, wrap: ab }
  const ba = b.wraps.find(w => w.tool === a.slug)
  return ba ? { host: b, guest: a, wrap: ba } : undefined
}

/**
 * One sentence about the difference that matters most, first match wins.
 *
 * The order is deliberate. A dead product outranks its price, an edge in the `wraps` graph
 * outranks a licence, and the cheap universal fields (platforms, hosts, features) sit at the
 * bottom because they always differ and would otherwise swallow every pair.
 *
 * There is no "different layers, so they complement each other" rule. `relatedPairs` only builds
 * same-layer pairs and `wraps` edges, and outside an edge that claim is false more often than
 * not: people genuinely choose between an editor and a terminal agent.
 */
function pairDelta(a: ToolSummary, b: ToolSummary, now: Date): string | undefined {
  const dead = [a, b].filter(t => t.status === 'sunset')
  if (dead.length === 2) {
    return `${a.name} ${sunsetClause(a, now)}, ${b.name} ${sunsetClause(b, now)}.`
  }
  if (dead.length === 1) {
    const [gone] = dead as [ToolSummary]
    const live = gone === a ? b : a
    return `${gone.name} ${sunsetClause(gone, now)}, ${live.name} is ${live.status === 'preview' ? 'in preview' : optionLabelLower(STATUSES, live.status)}.`
  }

  const edge = wrapEdge(a, b)
  if (edge) {
    return edge.wrap.uses_subscription
      ? `${edge.host.name} runs ${edge.guest.name} on the login you already have for it.`
      : `${edge.host.name} runs ${edge.guest.name} with your own key, so model usage bills separately.`
  }

  const bundled = [a, b].filter(t => t.pricing.bundled_with)
  if (bundled.length === 1) {
    const [inPlan] = bundled as [ToolSummary]
    const other = inPlan === a ? b : a
    return `${inPlan.name} comes with ${optionLabel(PLANS, inPlan.pricing.bundled_with!)} plans, ${other.name} ${priceClause(other)}.`
  }

  if (a.open_source !== b.open_source) {
    const open = a.open_source ? a : b
    const closed = a.open_source ? b : a
    return `${open.name} is open source (${open.license.spdx}), ${closed.name} is ${optionLabelLower(LICENSE_KINDS, closed.license.kind)}.`
  }

  if (a.entry_price !== b.entry_price) {
    return `${a.name} ${priceClause(a)}, ${b.name} ${priceClause(b)}.`
  }

  if (a.models.local !== b.models.local) {
    const local = a.models.local ? a : b
    return `${local.name} runs local models, ${(local === a ? b : a).name} does not.`
  }

  if ((a.models.byok === 'none') !== (b.models.byok === 'none')) {
    const byok = a.models.byok === 'none' ? b : a
    return `${byok.name} takes your own API key, ${(byok === a ? b : a).name} does not.`
  }

  const platform = firstExtra(PLATFORMS, a.platforms, b.platforms) ?? firstExtra(PLATFORMS, b.platforms, a.platforms)
  if (platform) {
    const has = a.platforms.includes(platform.value) ? a : b
    return `${has.name} has a ${platform.label} build, ${(has === a ? b : a).name} does not.`
  }

  const host = firstExtra(HOSTS, a.hosts, b.hosts) ?? firstExtra(HOSTS, b.hosts, a.hosts)
  if (host) {
    const has = a.hosts.includes(host.value) ? a : b
    return `${has.name} installs into ${host.label}, ${(has === a ? b : a).name} does not.`
  }

  const feature = firstExtra(FEATURES, a.features, b.features) ?? firstExtra(FEATURES, b.features, a.features)
  if (feature) {
    const has = a.features.includes(feature.value) ? a : b
    return `${has.name} has ${lowerLabel(feature.label)}, ${(has === a ? b : a).name} does not.`
  }

  // Nothing above fired, so the two records genuinely agree on every field worth a sentence.
  // The identity clause still names both products, which no other pair's does.
  return undefined
}

/** The lede on the comparison itself, which says what each product actually is. */
export function pairIntro(a: ToolSummary, b: ToolSummary) {
  const what = (t: ToolSummary) => `${t.name} is ${articleFor(optionLabel(LAYERS, t.layer))} by ${t.vendor}`
  return `${what(a)}. ${what(b)}. Every cell below is read from the directory data and points back to a vendor page.`
}
