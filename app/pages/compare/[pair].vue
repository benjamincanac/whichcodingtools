<script setup lang="ts">
import { LAYERS, optionLabelLower } from '#shared/enums'
import { parsePair } from '#shared/utils/compare'

const route = useRoute()
const { bySlug, ready } = useTools()
await ready

const pair = parsePair(String(route.params.pair))
const picked = pair ? pair.map(s => bySlug.value.get(s)).filter(Boolean) : []

if (!pair || picked.length !== 2) {
  throw createError({ statusCode: 404, statusMessage: 'No such comparison', fatal: true })
}

const [a, b] = picked as [NonNullable<typeof picked[number]>, NonNullable<typeof picked[number]>]

function intro(t: typeof a) {
  const label = optionLabelLower(LAYERS, t.layer)
  return `${t.name} is ${/^[aeiou]/i.test(label) ? 'an' : 'a'} ${label} by ${t.vendor}`
}
const description = `${intro(a)}. ${intro(b)}. Every cell below is read from the directory data and points back to a vendor page.`

useSeoMeta({
  title: `${a.name} vs ${b.name}`,
  description: `${a.name} and ${b.name} side by side: pricing, included usage, overage, BYOK, platforms, features and what each one runs. Verified against vendor pages.`
})

defineOgImage('ToolSatori', {
  headline: 'Compare',
  title: `${a.name} vs ${b.name}`,
  description: `${a.description} ${b.description}`
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="`${a.name} vs ${b.name}`"
        :description="description"
        :links="[{ label: 'Add more tools', to: `/compare?tools=${a.slug},${b.slug}`, icon: 'i-lucide-plus', color: 'neutral', variant: 'solid' }]"
      />

      <UPageBody>
        <CompareTable
          :tools="[a, b]"
          :by-slug="bySlug"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
