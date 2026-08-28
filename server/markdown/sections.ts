import { API_BASE } from '#shared/api'
import { LAYERS, PLANS, type EnumOption, type Layer, type Plan } from '#shared/enums'
import {
  LAYER_INTROS,
  LAYER_SECONDARY_INTRO,
  PLAN_GROUPS,
  PLAN_INTROS,
  TOOLS_INDEX,
  layerPageTitle,
  layerSecondaryTitle,
  planPageTitle
} from '#shared/content/pages'
import { EMPTY_REQUIREMENTS, deltaLabel, matchTool, planAccess } from '#shared/utils/match'
import type { MarkdownContext, MarkdownPage } from './context'
import { blocks, heading, lead, link } from './md'
import { dataLicense } from './footer'
import { pricedToolLine, toolGroup, toolLine } from './groups'

/** The three list pages: same shape, different grouping rule. */

export function renderLayerPage(ctx: MarkdownContext, layer: EnumOption): MarkdownPage {
  const value = layer.value as Layer
  const intro = LAYER_INTROS[value]
  const primary = ctx.tools.filter(t => t.layer === value)
  const secondary = ctx.tools.filter(t => t.secondary_layers.includes(value))

  return {
    title: layerPageTitle(layer),
    description: intro,
    markdown: blocks(
      lead(`${layer.label}s`, intro),
      toolGroup(2, `${layer.label}s`, undefined, primary.map(pricedToolLine)),
      secondary.length > 0 && toolGroup(2, layerSecondaryTitle(layer), LAYER_SECONDARY_INTRO, secondary.map(pricedToolLine)),
      blocks(heading(2, 'Related'), link('Open in the finder', `/tools?where=${value}`)),
      dataLicense()
    )
  }
}

export function renderPlanPage(ctx: MarkdownContext, plan: EnumOption): MarkdownPage {
  const value = plan.value as Plan
  const intro = PLAN_INTROS[value]

  const entries = ctx.tools
    .map(tool => ({ tool, access: planAccess(tool, value, ctx.bySlug) }))
    .filter((entry): entry is { tool: typeof entry.tool, access: NonNullable<typeof entry.access> } => Boolean(entry.access))

  // The chip the page shows next to each card: what the tool costs on top of this plan.
  const req = { ...EMPTY_REQUIREMENTS, plans: [value] }
  const line = (tool: typeof entries[number]['tool']) => toolLine(tool, deltaLabel(matchTool(tool, req, ctx.bySlug)))

  const pick = {
    included: () => entries.filter(e => e.access.included),
    signin: () => entries.filter(e => !e.access.included && !e.access.via),
    wraps: () => entries.filter(e => Boolean(e.access.via))
  }

  const groups = PLAN_GROUPS
    .map(group => ({ group, items: pick[group.key]() }))
    .filter(({ items }) => items.length)
    .map(({ group, items }) => toolGroup(2, group.title, group.description, items.map(e => line(e.tool))))

  return {
    title: planPageTitle(plan),
    description: intro,
    markdown: blocks(
      lead(planPageTitle(plan), intro),
      groups.length
        ? groups.join('\n\n')
        : `No tool lists ${plan.label} as a plan it is part of or signs in with.`,
      blocks(heading(2, 'Related'), link('Open in the finder', `/tools?plans=${value}`)),
      dataLicense()
    )
  }
}

/**
 * The finder is a query-driven page, so its twin drops the query and lists the whole corpus by
 * layer. An agent that wants it filtered has the JSON API.
 */
export function renderToolsIndex(ctx: MarkdownContext): MarkdownPage {
  const groups = LAYERS
    .map(layer => ({ layer, items: ctx.tools.filter(t => t.layer === layer.value) }))
    .filter(({ items }) => items.length)
    .map(({ layer, items }) => toolGroup(2, `${layer.label}s`, LAYER_INTROS[layer.value], items.map(pricedToolLine)))

  return {
    title: TOOLS_INDEX.title,
    description: TOOLS_INDEX.description,
    markdown: blocks(
      lead(TOOLS_INDEX.title, TOOLS_INDEX.description),
      `Every tool below, and every field behind it, is also one JSON document at ${link(`${API_BASE}/tools.json`, `${API_BASE}/tools.json`)}. The finder itself takes filters on the query string, which this page ignores.`,
      groups.join('\n\n'),
      blocks(heading(2, 'Related'), [
        `- ${link('Compare any two', '/compare')}`,
        ...PLANS.map(plan => `- ${link(planPageTitle(plan), `/plans/${plan.value}`)}`)
      ].join('\n')),
      dataLicense()
    )
  }
}
