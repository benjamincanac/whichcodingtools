<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { PLANS, optionLabel } from '#shared/enums'
import type { Tier } from '#shared/schema'
import type { ToolRecord } from '#shared/types/tool'
import { resolvePricing } from '#shared/utils/pricing'

const props = defineProps<{
  tool: ToolRecord
  bySlug: Map<string, ToolRecord>
}>()

const pricing = computed(() => resolvePricing(props.tool, props.bySlug))
const sameAs = computed(() => props.tool.pricing.same_as ? props.bySlug.get(props.tool.pricing.same_as) : undefined)
const pricingSource = computed(() => props.tool.sources.find(s => s.covers.includes('pricing')))

const columns: TableColumn<Tier>[] = [
  { accessorKey: 'name', header: 'Plan' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'included', header: 'Included' },
  { accessorKey: 'overage', header: 'Beyond that' },
  { accessorKey: 'limits', header: 'Notes' }
]

function priceText(tier: Tier) {
  if (tier.contact_sales) return 'Contact sales'
  if (tier.price === null) return tier.price_annual !== undefined ? `$${tier.price_annual}/mo annual` : 'Usage-based'
  if (tier.price === 0) return 'Free'
  return `${tier.price_from ? 'From ' : ''}$${tier.price}/mo`
}

function priceDetail(tier: Tier) {
  const parts: string[] = []
  if (tier.price !== null && tier.price > 0 && tier.per === 'user') parts.push('per user')
  if (tier.price !== null && tier.price_annual !== undefined) parts.push(`$${tier.price_annual}/mo billed annually`)
  if (tier.trial_days) parts.push(`${tier.trial_days}-day trial`)
  return parts.join(' · ')
}

function includedText(tier: Tier) {
  const inc = tier.included
  if (!inc) return null
  const unit = inc.unit === 'usd' ? `$${inc.amount}` : `${inc.amount.toLocaleString('en-US')} ${inc.unit}`
  const period = inc.period === 'month' ? '/mo' : inc.period === 'week' ? '/wk' : ''
  const value = inc.unit !== 'usd' && inc.usd_value !== undefined ? ` (≈ $${inc.usd_value})` : ''
  return `${unit}${period}${value}`
}

const overageLabels: Record<string, string> = {
  'api-list': 'API list price',
  'credits': 'Credit packs',
  'fixed': 'Fixed rate',
  'rate-limited': 'Rate limited until reset',
  'blocked': 'Blocked until upgrade'
}

function overageText(tier: Tier) {
  const o = tier.overage
  if (!o) return null
  let text = overageLabels[o.kind] ?? o.kind
  if (o.markup_pct) text += ` +${o.markup_pct}%`
  if (o.rate !== undefined) text += `, $${o.rate} each`
  return text
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p
      v-if="pricing.bundled_with"
      class="text-sm text-toned"
    >
      Included with <NuxtLink
        :to="`/plans/${pricing.bundled_with}`"
        class="underline underline-offset-4 text-highlighted"
      >{{ optionLabel(PLANS, pricing.bundled_with) }}</NuxtLink> plans<template v-if="sameAs">
        , same pricing as <NuxtLink
          :to="`/tools/${sameAs.slug}`"
          class="underline underline-offset-4 text-highlighted"
        >{{ sameAs.name }}</NuxtLink>
      </template>.
    </p>

    <UTable
      :data="pricing.tiers"
      :columns="columns"
      class="rounded-lg border border-default"
      :ui="{ base: 'min-w-160', thead: '[&>tr]:first:bg-elevated/50', th: 'text-xs uppercase tracking-wider font-medium text-muted', td: 'align-top text-sm whitespace-pre-wrap', root: 'overflow-x-auto', separator: 'bg-border' }"
    >
      <template #name-cell="{ row }">
        <div class="font-medium text-highlighted">
          {{ row.original.name }}
        </div>
        <div class="text-xs text-muted capitalize">
          {{ row.original.audience }}
        </div>
      </template>
      <template #price-cell="{ row }">
        <div class="font-mono text-highlighted whitespace-nowrap">
          {{ priceText(row.original) }}
        </div>
        <div
          v-if="priceDetail(row.original)"
          class="text-xs text-muted"
        >
          {{ priceDetail(row.original) }}
        </div>
      </template>
      <template #included-cell="{ row }">
        <template v-if="includedText(row.original)">
          <div class="font-mono text-highlighted whitespace-nowrap">
            {{ includedText(row.original) }}
          </div>
          <div
            v-if="row.original.included?.notes"
            class="text-xs text-muted"
          >
            {{ row.original.included.notes }}
          </div>
        </template>
        <span
          v-else
          class="text-dimmed"
        >—</span>
      </template>
      <template #overage-cell="{ row }">
        <template v-if="overageText(row.original)">
          <div class="text-highlighted">
            {{ overageText(row.original) }}
          </div>
          <div
            v-if="row.original.overage?.notes"
            class="text-xs text-muted"
          >
            {{ row.original.overage.notes }}
          </div>
        </template>
        <span
          v-else
          class="text-dimmed"
        >—</span>
      </template>
      <template #limits-cell="{ row }">
        <ul
          v-if="row.original.limits.length"
          class="list-disc ps-4 text-toned"
        >
          <li
            v-for="limit in row.original.limits"
            :key="limit"
          >
            {{ limit }}
          </li>
        </ul>
        <p
          v-if="row.original.notes"
          class="text-xs text-muted"
          :class="{ 'mt-1': row.original.limits.length }"
        >
          {{ row.original.notes }}
        </p>
        <span
          v-if="!row.original.limits.length && !row.original.notes"
          class="text-dimmed"
        >—</span>
      </template>
    </UTable>

    <p
      v-if="pricing.notes"
      class="text-sm text-toned"
    >
      {{ pricing.notes }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span v-if="pricingSource">
        Source:
        <ULink
          :to="pricingSource.url"
          target="_blank"
          class="text-highlighted underline underline-offset-4"
        >{{ pricingSource.url.replace(/^https?:\/\//, '') }}</ULink>
      </span>
      <ToolFreshness :freshness="tool.freshness" />
    </div>
  </div>
</template>
