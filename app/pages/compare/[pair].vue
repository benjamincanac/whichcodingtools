<script setup lang="ts">
import { parsePair } from '#shared/utils/compare'

const route = useRoute()
const { bySlug } = useTools()

const pair = parsePair(String(route.params.pair))
const picked = pair ? pair.map(s => bySlug.value.get(s)).filter(Boolean) : []

if (!pair || picked.length !== 2) {
  throw createError({ statusCode: 404, statusMessage: 'No such comparison', fatal: true })
}

const [a, b] = picked as [NonNullable<typeof picked[number]>, NonNullable<typeof picked[number]>]

useSeoMeta({
  title: `${a.name} vs ${b.name}`,
  description: `${a.name} and ${b.name} side by side: pricing, included usage, overage, BYOK, platforms, features and what each one runs. Verified against vendor pages.`
})

defineOgImageComponent('ToolSatori', {
  headline: 'Compare',
  title: `${a.name} vs ${b.name}`,
  description: `${a.description} ${b.description}`
})
</script>

<template>
  <UContainer>
    <UPageHeader
      :title="`${a.name} vs ${b.name}`"
      :description="`${a.name} is ${a.vendor}'s ${a.layer === 'harness' ? 'terminal agent' : a.layer}. ${b.name} is ${b.vendor}'s ${b.layer === 'harness' ? 'terminal agent' : b.layer}. Every cell below is read from the directory data and points back to a vendor page.`"
      :ui="{ root: 'py-8 lg:py-12' }"
      :links="[{ label: 'Add more tools', to: `/compare?tools=${a.slug},${b.slug}`, icon: 'i-lucide-plus', color: 'neutral', variant: 'outline' }]"
    />
    <div class="pb-16">
      <CompareTable
        :tools="[a, b]"
        :by-slug="bySlug"
      />
    </div>
  </UContainer>
</template>
