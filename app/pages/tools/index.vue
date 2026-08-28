<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { LAYERS, PLANS, lowerLabel } from '#shared/enums'
import { TOOLS_INDEX } from '#shared/content/pages'
import type { ToolMatch } from '~/composables/useToolFinder'

const route = useRoute()
const router = useRouter()
// Awaited like every other page, so arriving here from a link does not paint an empty grid
// for a tick before the corpus lands. The finder shares the request by key.
await useTools()
const { tools, requirements, sort, update, reset, count, plain, exact, close, hidden, matches } = useToolFinder()
const issueUrl = useIssueUrl()

/** Set by the landing page after the natural-language parse, shown once. */
const why = computed(() => typeof route.query.why === 'string' ? route.query.why : '')

useSeoMeta(TOOLS_INDEX)

defineOgImage('ToolSatori', {
  headline: 'Tools',
  title: 'Every AI coding tool, filtered by how you work',
  description: 'Editors, terminal agents, orchestrators and cloud agents with verified pricing and the graph of what runs what.'
})

/**
 * The input is local and the URL follows it. Writing `router.replace` on every keystroke put
 * a history entry and a full re-rank behind each character; the filters stay deep linkable,
 * they just settle once typing pauses.
 */
const typed = ref(requirements.value.q)
watch(() => requirements.value.q, (q) => {
  if (q !== typed.value) typed.value = q
})
// The guard is what makes `reset()` stick: it clears `requirements.q`, the watcher pulls
// `typed` back with it, and a keystroke still waiting out its delay would otherwise land
// afterwards and put the old search back.
const commitSearch = useDebounceFn((q: string) => {
  if (q === typed.value) update('q', q)
}, 200)
const search = computed({
  get: () => typed.value,
  set: (q: string) => {
    typed.value = q
    commitSearch(q)
  }
})

const searchInput = useTemplateRef('searchInput')
defineShortcuts({
  '/': () => searchInput.value?.inputRef?.focus()
})

const sortItems = [
  { label: 'Best match', value: 'match' },
  { label: 'Name', value: 'name' },
  { label: 'Recently verified', value: 'verified' },
  { label: 'Entry price', value: 'price' }
]

const open = ref(false)

const summary = computed(() => {
  if (count.value) {
    const parts = [`${exact.value.length} of ${tools.value.length} tools match everything`]
    if (close.value.length) parts.push(`${close.value.length} come${close.value.length === 1 ? 's' : ''} close`)
    if (hidden.value) parts.push(`${hidden.value} hidden`)
    return `${parts.join(', ')}.`
  }
  const q = requirements.value.q ? ` matching "${requirements.value.q}"` : ''
  return `${matches.value.length} tool${matches.value.length === 1 ? '' : 's'}${q}. Pick what you need on the left to rank them.`
})

/** The written page behind a single picked plan or layer, so the finder points back at it. */
const guide = computed(() => {
  const { plans, where } = requirements.value
  const plan = plans.length === 1 ? PLANS.find(p => p.value === plans[0]) : undefined
  if (plan) return { label: `What a ${plan.label} subscription gets you`, to: `/plans/${plan.value}` }
  const layer = where.length === 1 ? LAYERS.find(l => l.value === where[0]) : undefined
  if (layer) return { label: `More about ${lowerLabel(layer.label)}s`, to: `/layers/${layer.value}` }
  return null
})

const grouped = computed<{ key: string, title?: string, description?: string, items: ToolMatch[] }[]>(() => {
  if (count.value) {
    return [
      { key: 'exact', title: 'Matches everything', items: exact.value },
      { key: 'close', title: 'Close matches', description: 'One or two requirements short. Each card says which.', items: close.value }
    ]
  }
  // Nothing asked for: group by layer, the same shape the markdown twin at /raw/tools.md has.
  // A flat list here has no order a visitor can read, since almost every tool starts at $0.
  if (plain.value && sort.value === 'match') {
    return LAYERS
      .map(layer => ({
        key: layer.value,
        title: `${layer.label}s`,
        description: layer.description,
        items: matches.value.filter(m => m.tool.layer === layer.value)
      }))
      .filter(group => group.items.length)
  }
  return [{ key: 'all', items: matches.value }]
})
</script>

<template>
  <UContainer>
    <UPage :ui="{ root: 'lg:grid-cols-12', left: 'lg:col-span-3', center: 'lg:col-span-9' }">
      <template #left>
        <UPageAside>
          <ToolFinder
            :requirements="requirements"
            :count="count"
            @update="update"
            @reset="reset"
          />
        </UPageAside>
      </template>

      <UPageBody class="space-y-4">
        <UAlert
          v-if="why"
          color="neutral"
          variant="soft"
          icon="i-lucide-sparkles"
          :title="why"
          description="The filters on the left reflect that. Adjust them if something is off."
          :ui="{ title: 'font-medium', description: 'text-toned' }"
          close
          @update:open="router.replace({ query: { ...route.query, why: undefined } })"
        />

        <p class="text-sm text-muted">
          {{ summary }}
          <ULink
            v-if="guide"
            :to="guide.to"
            class="text-highlighted underline underline-offset-4"
          >{{ guide.label }}</ULink>
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
          <UInput
            ref="searchInput"
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by name or vendor"
            class="flex-1"
            autofocus
            :ui="{ trailing: 'pe-1.5' }"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UInput>

          <div class="flex items-center gap-2">
            <UButton
              :label="count ? `Requirements (${count})` : 'Requirements'"
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              variant="outline"
              class="lg:hidden"
              @click="open = true"
            />
            <USelectMenu
              v-model="sort"
              :items="sortItems"
              value-key="value"
              :search-input="false"
              icon="i-lucide-arrow-up-down"
              class="w-44"
            />
          </div>
        </div>

        <template v-if="matches.length && (exact.length || close.length || !count)">
          <ToolMatchList
            v-for="group in grouped"
            :key="group.key"
            :title="group.title"
            :description="group.description"
            :items="group.items"
          />
        </template>

        <UEmpty
          v-else
          icon="i-lucide-search-x"
          title="Nothing comes close"
          :description="count ? `No tool satisfies ${count > 2 ? 'most of' : ''} what you picked${hidden ? `, ${hidden} miss three requirements or more` : ''}. Drop one and try again.` : 'No tool matches that search.'"
          :actions="[
            { label: 'Reset requirements', color: 'neutral', variant: 'outline', onClick: reset },
            { label: 'Add a missing tool', color: 'neutral', variant: 'ghost', icon: 'i-lucide-plus', to: issueUrl('tool'), target: '_blank' }
          ]"
        />
      </UPageBody>
    </UPage>

    <USlideover
      v-model:open="open"
      title="What you need"
      side="left"
      :transition="false"
    >
      <template #body>
        <ToolFinder
          :requirements="requirements"
          :count="count"
          @update="update"
          @reset="reset"
        />
      </template>
    </USlideover>
  </UContainer>
</template>
