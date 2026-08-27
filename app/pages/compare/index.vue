<script setup lang="ts">
import { COMPARE_INDEX } from '#shared/content/pages'
import { pairSlug } from '#shared/utils/compare'

const route = useRoute()
const router = useRouter()
const { tools, bySlug, ready } = useTools()
await ready

const MAX = 4

/** Landing on /compare with nothing picked shows a real comparison instead of an empty table. */
const DEFAULT_TOOLS = ['fx', 'opencode']

/** `?tools=` emptied by hand stays empty, no query at all falls back to the default pair. */
const explicit = computed(() => route.query.tools !== undefined)

const selected = computed<string[]>({
  get: () => (explicit.value ? String(route.query.tools).split(',') : DEFAULT_TOOLS).filter(s => bySlug.value.has(s)).slice(0, MAX),
  set: slugs => router.replace({ query: { tools: slugs.slice(0, MAX).join(',') } })
})

const picked = computed(() => selected.value.map(s => bySlug.value.get(s)!))

const pairUrl = computed(() => picked.value.length === 2 ? `/compare/${pairSlug(picked.value[0]!.slug, picked.value[1]!.slug)}` : null)

useSeoMeta({
  title: explicit.value && picked.value.length ? `Compare ${picked.value.map(t => t.name).join(', ')}` : COMPARE_INDEX.title,
  description: COMPARE_INDEX.description
})

defineOgImage('ToolSatori', {
  headline: 'Compare',
  title: 'Compare AI coding tools side by side',
  description: 'Pricing, included usage, overage, BYOK, platforms, features and what runs what.'
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        title="Compare"
        description="Pick up to four tools. Every cell comes from the YAML in the repo, with the date the pricing was last checked on the last row."
      >
        <template #title>
          Compare
          <UButton
            v-if="pairUrl"
            :to="pairUrl"
            icon="i-lucide-link"
            color="neutral"
            variant="ghost"
            class="rounded-full"
          />
        </template>

        <template #links>
          <ComparePicker
            v-model="selected"
            :tools="tools"
            :max="MAX"
          />
        </template>
      </UPageHeader>

      <UPageBody>
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
      </UPageBody>
    </UPage>
  </UContainer>
</template>
