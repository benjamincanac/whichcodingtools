<script setup lang="ts">
import { pairSlug } from '#shared/utils/compare'

const route = useRoute()
const router = useRouter()
const { tools, bySlug, ready } = useTools()
await ready

const MAX = 4

const selected = computed<string[]>({
  get: () => String(route.query.tools ?? '').split(',').filter(s => bySlug.value.has(s)).slice(0, MAX),
  set: slugs => router.replace({ query: slugs.length ? { tools: slugs.slice(0, MAX).join(',') } : {} })
})

const picked = computed(() => selected.value.map(s => bySlug.value.get(s)!))

const items = computed(() => tools.value.map(t => ({ label: t.name, value: t.slug, icon: t.icon, description: t.vendor })))

const pairUrl = computed(() => picked.value.length === 2 ? `/compare/${pairSlug(picked.value[0]!.slug, picked.value[1]!.slug)}` : null)

useSeoMeta({
  title: picked.value.length ? `Compare ${picked.value.map(t => t.name).join(', ')}` : 'Compare AI coding tools',
  description: 'Side by side pricing, included usage, overage, BYOK, platforms, features and integrations for any AI coding tools, from vendor-verified data.'
})

defineOgImage('ToolSatori', {
  headline: 'Compare',
  title: 'Compare AI coding tools side by side',
  description: 'Pricing, included usage, overage, BYOK, platforms, features and what runs what.'
})
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Compare"
      description="Pick up to four tools. Every cell comes from the YAML in the repo, with the date the pricing was last checked on the last row."
      :ui="{ root: 'py-8 lg:py-12' }"
    />

    <div class="flex flex-col gap-6 pb-16">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
        <USelectMenu
          v-model="selected"
          :items="items"
          value-key="value"
          multiple
          placeholder="Add tools to compare"
          icon="i-lucide-columns-3"
          class="sm:w-96"
        />
        <UButton
          v-if="pairUrl"
          :to="pairUrl"
          label="Permanent link"
          icon="i-lucide-link"
          color="neutral"
          variant="outline"
        />
      </div>

      <CompareTable
        v-if="picked.length"
        :tools="picked"
        :by-slug="bySlug"
      />
      <UEmpty
        v-else
        icon="i-lucide-columns-3"
        title="Nothing to compare yet"
        description="Add two or more tools above, or open a comparison from a tool page."
      />
    </div>
  </UContainer>
</template>
