import { BYOK, LAYERS, LICENSE_KINDS, PLANS, STATUSES, WRAP_VIA, optionLabel, optionLabelLower } from '#shared/enums'
import { toolPageTitle } from '#shared/content/pages'
import type { ToolRecord } from '#shared/types/tool'
import { costDelta, deltaText, includedText, overageText, priceDetail, priceText, resolvePricing } from '#shared/utils/pricing'
import { displayUrl, joinLabels } from '#shared/utils/text'
import { featureOptions, providerOptions, toolFacts } from '#shared/utils/tools'
import type { MarkdownContext, MarkdownPage } from './context'
import { blocks, bullets, code, definitions, heading, lead, link, sentences, table } from './md'
import { toolLine } from './groups'

/** The label under a link, without the scheme, the way the page renders every external URL. */
const LINK_LABELS: [keyof ToolRecord['links'], string][] = [
  ['pricing', 'Pricing'],
  ['repo', 'Repo'],
  ['docs', 'Docs'],
  ['changelog', 'Changelog'],
  ['discord', 'Discord'],
  ['x', 'X']
]

/** A sunset or beta product has to say so before anything else on the page is read as current. */
function status(ctx: MarkdownContext, tool: ToolRecord): string | false {
  if (tool.status === 'active') return false
  const successor = tool.successor ? ctx.bySlug.get(tool.successor) : undefined
  const parts = [
    tool.status === 'sunset'
      ? `Discontinued${tool.sunset_at ? ` on ${tool.sunset_at}` : ''}.`
      : `${optionLabel(STATUSES, tool.status)}.`,
    successor && `Succeeded by ${link(successor.name, `/tools/${successor.slug}`)}.`
  ]
  return `> ${parts.filter(Boolean).join(' ')}`
}

function pricing(ctx: MarkdownContext, tool: ToolRecord): string {
  const resolved = resolvePricing(tool, ctx.bySlug)
  const sameAs = tool.pricing.same_as ? ctx.bySlug.get(tool.pricing.same_as) : undefined
  const source = tool.sources.find(s => s.covers.includes('pricing'))

  // The page opens the section with this when a tier comes from somewhere else, and without it
  // four tools would show a table whose numbers have no visible owner.
  const provenance = resolved.bundled_with || sameAs
    ? [
        resolved.bundled_with && `Included with ${link(optionLabel(PLANS, resolved.bundled_with), `/plans/${resolved.bundled_with}`)} plans.`,
        sameAs && `Same pricing as ${link(sameAs.name, `/tools/${sameAs.slug}`)}.`
      ].filter(Boolean).join(' ')
    : false

  const rows = resolved.tiers.map((tier) => {
    const detail = priceDetail(tier)
    return [
      `${tier.name} (${tier.audience})`,
      detail ? `${priceText(tier)} (${detail})` : priceText(tier),
      sentences(includedText(tier), tier.included?.notes),
      sentences(overageText(tier), tier.overage?.notes),
      sentences(tier.limits.join('; '), tier.notes)
    ]
  })

  return blocks(
    heading(2, 'Pricing'),
    provenance,
    rows.length ? table(['Plan', 'Price', 'Included', 'Beyond that', 'Notes'], rows) : 'No pricing recorded yet.',
    resolved.notes,
    source && `Source: ${link(displayUrl(source.url), source.url)}, verified ${source.verified_at}.`
  )
}

function worksWith(ctx: MarkdownContext, tool: ToolRecord): string | false {
  // A wrap can name a tool that is not in the directory, and `wrapped_by` is only ever built
  // from tools that are, but both get filtered so a missing entry can never throw mid-render.
  const runs = tool.wraps
    .map(wrap => ({ wrap, target: ctx.bySlug.get(wrap.tool) }))
    .filter((item): item is { wrap: typeof item.wrap, target: ToolRecord } => Boolean(item.target))
    .map(({ wrap, target }) => sentences(toolLine(target, [
      `via ${optionLabelLower(WRAP_VIA, wrap.via)}`,
      // `costDelta(tool, wrapped)`: what this tool adds on top of the one it runs.
      deltaText(costDelta(tool, wrap.tool, ctx.bySlug))
    ].filter(Boolean).join(', ')), wrap.notes))

  const runsInside = tool.wrapped_by
    .map(slug => ctx.bySlug.get(slug))
    .filter((host): host is ToolRecord => Boolean(host))
    .map((host) => {
      const wrap = host.wraps.find(w => w.tool === tool.slug)
      return toolLine(host, [
        wrap && `via ${optionLabelLower(WRAP_VIA, wrap.via)}`,
        // Inverted on purpose: what the host adds on top of this tool.
        deltaText(costDelta(host, tool.slug, ctx.bySlug))
      ].filter(Boolean).join(', '))
    })

  if (!runs.length && !runsInside.length) return false

  return blocks(
    heading(2, 'Works with'),
    `What ${tool.name} runs, and what can run ${tool.name}. "With your existing login" means the wrapped tool's subscription is reused, no second bill.`,
    runs.length > 0 && blocks(heading(3, 'Runs'), bullets(runs)),
    runsInside.length > 0 && blocks(heading(3, 'Runs inside'), bullets(runsInside))
  )
}

function models(tool: ToolRecord): string {
  const providers = providerOptions(tool).map(p => p.label)
  const inherited = !tool.models.providers?.length && tool.effective_providers.length > 0
  return blocks(
    heading(2, 'Models'),
    definitions([
      ['Providers', joinLabels(providers, 'None recorded') + (inherited ? ', inherited from the tools it runs' : '')],
      ['Bring your own key', optionLabel(BYOK, tool.models.byok)],
      ['Local models', tool.models.local ? 'Yes' : 'No'],
      ['Signs in with', tool.models.plans.length > 0 && joinLabels(tool.models.plans.map(p => optionLabel(PLANS, p)))]
    ]),
    tool.models.notes
  )
}

function features(tool: ToolRecord): string {
  const options = featureOptions(tool)
  return blocks(
    heading(2, 'Features'),
    options.length
      // The description is the tooltip the page shows, which is the only place it appears.
      ? bullets(options.map(f => `**${f.label}**${f.description ? `: ${f.description}` : ''}`))
      : 'No features recorded yet.'
  )
}

function install(tool: ToolRecord): string | false {
  if (!tool.install.length) return false
  return blocks(
    heading(2, 'Install'),
    bullets(tool.install.map(step => `**${step.method}**: ${step.command ? code(step.command) : link(displayUrl(step.url!), step.url!)}`))
  )
}

function license(tool: ToolRecord): string {
  return blocks(
    heading(2, 'License'),
    definitions([
      ['SPDX', tool.license.spdx === 'proprietary' ? 'Proprietary' : tool.license.spdx],
      ['Kind', optionLabel(LICENSE_KINDS, tool.license.kind)],
      ['Repo', tool.license.repo && link(displayUrl(tool.license.repo), tool.license.repo)]
    ]),
    tool.license.notes
  )
}

function sources(ctx: MarkdownContext, tool: ToolRecord): string {
  return blocks(
    heading(2, 'Sources'),
    'Every fact above points at a vendor page and the date someone last checked it.',
    table(
      ['Source', 'Covers', 'Verified'],
      // Absolute dates, not `relativeDays()`: this document is read detached from the site and
      // cached for an hour, so "3 days ago" would be wrong before anyone noticed.
      tool.sources.map(source => [link(displayUrl(source.url), source.url), source.covers.join(', '), source.verified_at])
    ),
    `Source data: ${link(`content/tools/${tool.slug}.yml`, ctx.yamlUrl(tool.slug))}`
  )
}

function related(tool: ToolRecord, plans: string[]): string {
  return blocks(
    heading(2, 'Related'),
    bullets([
      link(`Compare ${tool.name} with another tool`, `/compare?tools=${tool.slug}`),
      link(`All ${optionLabelLower(LAYERS, tool.layer)}s`, `/layers/${tool.layer}`),
      ...plans.map(plan => link(`Everything on ${optionLabel(PLANS, plan)}`, `/plans/${plan}`))
    ])
  )
}

export function renderToolPage(ctx: MarkdownContext, tool: ToolRecord): MarkdownPage {
  const bundled = resolvePricing(tool, ctx.bySlug).bundled_with
  const plans = PLANS.filter(p => p.value === bundled || tool.models.plans.includes(p.value)).map(p => p.value)

  const links = LINK_LABELS
    .map(([key, label]) => tool.links[key] && link(label, tool.links[key]!))
    .filter(Boolean) as string[]

  return {
    title: toolPageTitle(tool),
    description: tool.description,
    updatedAt: tool.freshness.verified_at,
    markdown: blocks(
      lead(tool.name, tool.description),
      status(ctx, tool),
      definitions([
        ...toolFacts(tool).map(fact => [fact.label, fact.value] as [string, string]),
        ['JSON', `/api/tools/${tool.slug}.json`]
      ]),
      blocks(heading(2, 'Links'), bullets([link('Website', tool.homepage), ...links])),
      pricing(ctx, tool),
      worksWith(ctx, tool),
      models(tool),
      features(tool),
      install(tool),
      license(tool),
      sources(ctx, tool),
      related(tool, plans)
    )
  }
}
