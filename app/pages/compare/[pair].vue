<script setup lang="ts">
import { pairIntro, pairPageDescription, pairPageTitle } from '#shared/content/pages'
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

const description = pairIntro(a, b)

useSeoMeta({
  title: pairPageTitle(a, b),
  description: pairPageDescription(a, b)
})

defineOgImage('ToolSatori', {
  headline: 'Compare',
  title: pairPageTitle(a, b),
  description: `${a.description} ${b.description}`
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="pairPageTitle(a, b)"
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
