import { z } from 'zod'
import {
  AUDIENCES,
  BYOK_VALUES,
  FEATURE_VALUES,
  HOST_VALUES,
  INCLUDED_PERIODS,
  INCLUDED_UNITS,
  INSTALL_METHODS,
  LAYER_VALUES,
  LICENSE_KIND_VALUES,
  OVERAGE_KINDS,
  PLAN_VALUES,
  PLATFORM_VALUES,
  PRICE_PER,
  PROVIDER_VALUES,
  SOURCE_COVERS,
  STATUS_VALUES,
  WRAP_VIA_VALUES
} from './enums'

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits and single dashes')
const isoDate = z.string().date()
const url = z.url()

export const IncludedSchema = z.object({
  amount: z.number().nonnegative(),
  unit: z.enum(INCLUDED_UNITS),
  period: z.enum(INCLUDED_PERIODS).default('month'),
  usd_value: z.number().nonnegative().optional(),
  notes: z.string().optional()
})

export const OverageSchema = z.object({
  kind: z.enum(OVERAGE_KINDS),
  markup_pct: z.number().nonnegative().optional(),
  rate: z.number().nonnegative().optional(),
  notes: z.string().optional()
})

export const TierSchema = z.object({
  id: slug,
  name: z.string().min(1),
  price: z.number().nonnegative().nullable(),
  price_annual: z.number().nonnegative().optional(),
  price_from: z.boolean().default(false),
  per: z.enum(PRICE_PER).default('user'),
  audience: z.enum(AUDIENCES),
  contact_sales: z.boolean().default(false),
  trial_days: z.number().int().positive().optional(),
  included: IncludedSchema.optional(),
  overage: OverageSchema.optional(),
  limits: z.array(z.string()).default([]),
  notes: z.string().optional()
}).refine(
  t => t.price !== null || t.price_annual !== undefined || t.contact_sales || t.overage,
  { message: 'a tier needs a price, an annual price, contact_sales or an overage', path: ['price'] }
)

export const PricingSchema = z.object({
  same_as: slug.optional(),
  bundled_with: z.enum(PLAN_VALUES).optional(),
  tiers: z.array(TierSchema).optional(),
  notes: z.string().optional()
}).superRefine((pricing, ctx) => {
  if (pricing.same_as && pricing.tiers) {
    ctx.addIssue({ code: 'custom', message: 'same_as and tiers are exclusive', path: ['same_as'] })
  }
  if (!pricing.same_as && !pricing.tiers?.length) {
    ctx.addIssue({ code: 'custom', message: 'pricing needs tiers or same_as', path: ['tiers'] })
  }
  const ids = pricing.tiers?.map(t => t.id) ?? []
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  for (const id of new Set(dupes)) {
    ctx.addIssue({ code: 'custom', message: `duplicate tier id "${id}"`, path: ['tiers'] })
  }
})

export const WrapSchema = z.object({
  tool: slug,
  via: z.enum(WRAP_VIA_VALUES),
  uses_subscription: z.boolean(),
  min_tier: slug.optional(),
  notes: z.string().optional()
})

export const LicenseSchema = z.object({
  spdx: z.string().min(1),
  kind: z.enum(LICENSE_KIND_VALUES),
  repo: url.optional(),
  notes: z.string().optional()
}).refine(
  l => l.kind !== 'open-source' || Boolean(l.repo),
  { message: 'an open-source license needs a repo url', path: ['repo'] }
)

export const ModelsSchema = z.object({
  providers: z.array(z.enum(PROVIDER_VALUES)).optional(),
  byok: z.enum(BYOK_VALUES).default('none'),
  local: z.boolean().default(false),
  notes: z.string().optional()
})

export const InstallSchema = z.object({
  method: z.enum(INSTALL_METHODS),
  command: z.string().optional(),
  url: url.optional()
}).refine(i => i.command || i.url, { message: 'an install entry needs a command or a url', path: ['command'] })

export const AliasSchema = z.object({
  slug,
  name: z.string().min(1),
  until: isoDate,
  note: z.string().optional()
})

export const SourceSchema = z.object({
  url,
  verified_at: isoDate,
  covers: z.array(z.enum(SOURCE_COVERS)).min(1)
})

export const LinksSchema = z.object({
  docs: url.optional(),
  pricing: url.optional(),
  changelog: url.optional(),
  repo: url.optional(),
  discord: url.optional(),
  x: url.optional()
})

export const ToolSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(40).max(180),
  layer: z.enum(LAYER_VALUES),
  secondary_layers: z.array(z.enum(LAYER_VALUES)).default([]),
  vendor: z.string().min(1),
  homepage: url,
  links: LinksSchema.default({}),
  icon: z.string().optional(),
  platforms: z.array(z.enum(PLATFORM_VALUES)).min(1),
  hosts: z.array(z.enum(HOST_VALUES)).default([]),
  install: z.array(InstallSchema).default([]),
  license: LicenseSchema,
  models: ModelsSchema,
  features: z.array(z.enum(FEATURE_VALUES)).default([]),
  wraps: z.array(WrapSchema).default([]),
  pricing: PricingSchema,
  status: z.enum(STATUS_VALUES).default('active'),
  sunset_at: isoDate.optional(),
  successor: slug.optional(),
  aliases: z.array(AliasSchema).default([]),
  sources: z.array(SourceSchema).min(1)
}).superRefine((tool, ctx) => {
  if (!tool.sources.some(s => s.covers.includes('pricing'))) {
    ctx.addIssue({ code: 'custom', message: 'at least one source must cover pricing', path: ['sources'] })
  }
  if (tool.secondary_layers.includes(tool.layer)) {
    ctx.addIssue({ code: 'custom', message: 'secondary_layers repeats the primary layer', path: ['secondary_layers'] })
  }
  if (tool.status === 'sunset' && !tool.sunset_at) {
    ctx.addIssue({ code: 'custom', message: 'a sunset tool needs sunset_at', path: ['sunset_at'] })
  }
  if (tool.pricing.tiers) {
    const ids = new Set(tool.pricing.tiers.map(t => t.id))
    tool.wraps.forEach((w, i) => {
      if (w.min_tier && !ids.has(w.min_tier)) {
        ctx.addIssue({ code: 'custom', message: `min_tier "${w.min_tier}" is not a tier of this tool`, path: ['wraps', i, 'min_tier'] })
      }
    })
  }
  const today = new Date().toISOString().slice(0, 10)
  tool.sources.forEach((s, i) => {
    if (s.verified_at > today) {
      ctx.addIssue({ code: 'custom', message: 'verified_at is in the future', path: ['sources', i, 'verified_at'] })
    }
  })
})

export type Tool = z.infer<typeof ToolSchema>
export type ToolInput = z.input<typeof ToolSchema>
export type Tier = z.infer<typeof TierSchema>
export type Pricing = z.infer<typeof PricingSchema>
export type Wrap = z.infer<typeof WrapSchema>
export type ToolSource = z.infer<typeof SourceSchema>
export type ToolAlias = z.infer<typeof AliasSchema>

/**
 * JSON Schema handed to comark-content. Its validator only reads `type`,
 * `properties`, `required` and `items`, so refinements and enums above are
 * enforced by `scripts/validate.ts`, which runs before the build.
 */
export function toolJsonSchema() {
  return z.toJSONSchema(ToolSchema, { io: 'input', unrepresentable: 'any' })
}
