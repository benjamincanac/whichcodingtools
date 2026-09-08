<script setup lang="ts">
import { useDebounceFn, useIntervalFn } from '@vueuse/core'
import { API_BASE } from '#shared/api'
import { LAYERS, PLANS, lowerLabel } from '#shared/enums'
import type { ParsedRequirements } from '#shared/finder'
import { toRequirements } from '#shared/finder'
import { toQuery, type ToolMatch } from '~/composables/useToolFinder'

const route = useRoute()
const router = useRouter()
const { site } = useAppConfig()
// Awaited like every other page, so arriving here from a link does not paint an empty grid
// for a tick before the corpus lands. The finder shares the request by key.
await useTools()
const { tools, requirements, sort, update, reset, count, plain, exact, close, hidden, matches } = useToolFinder()
const issueUrl = useIssueUrl()

/** Set after the natural-language parse, shown until the next filter change drops it. */
const why = computed(() => typeof route.query.why === 'string' ? route.query.why : '')

useSeoMeta({
  title: 'Find the AI coding tool that fits how you work',
  description: `Every editor, terminal agent, orchestrator and cloud agent, with pricing verified against vendor pages. Tell ${site.name} what you need and get the best fit.`
})

defineOgImage('ToolSatori', {
  headline: 'AI coding tools',
  title: 'Find the AI coding tool that fits how you work',
  description: 'Editors, terminal agents, orchestrators and cloud agents with verified pricing and the graph of what runs what.'
})

/**
 * One box, two behaviours. Typing filters by name as you go, the way a directory should.
 * Enter hands the same text to the parser, which turns a sentence into the filters on the
 * left. Nothing decides which one you meant: a name shows its matches before you can press
 * Enter, and a sentence empties the grid, which is the cue to press it.
 *
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

/** The parser refuses anything shorter. */
const askable = computed(() => typed.value.trim().length >= 3)
const asking = ref(false)

async function ask() {
  const text = typed.value.trim()
  if (asking.value || text.length < 3) return
  asking.value = true
  try {
    const { parsed } = await $fetch<{ parsed: ParsedRequirements }>(`${API_BASE}/finder/parse`, { method: 'POST', body: { query: text } })
    // The sentence becomes filters, and the box keeps only the name the parser pulled out of
    // it. Set here rather than left to the watcher: with nothing to search the query does not
    // change, and a debounce still pending would put the sentence back as a name search.
    typed.value = parsed.q
    // One replace carrying `why`. The requirements setter drops it, which is what retires the
    // summary the moment a filter is changed by hand.
    await router.replace({ query: { ...toQuery(toRequirements(parsed), sort.value), why: parsed.summary } })
  } catch {
    // The model is unavailable: the text stays a plain name search so the box still does something.
    update('q', text)
  } finally {
    asking.value = false
  }
}

const examples = [
  'Runs on Vercel AI Gateway',
  'Terminal agent on macOS',
  'I already pay for Claude Max',
  'An IDE with the agent built in',
  'Open source with local models'
]

function useExample(text: string) {
  typed.value = text
  ask()
}

// The placeholder cycles through the examples while the field is empty. Tab, or ArrowRight as the
// shell convention, accepts the one on screen. With text in the field both keys keep their default,
// so the form stays reachable by keyboard.
const placeholderIndex = ref(0)
const placeholder = computed(() => examples[placeholderIndex.value]!)
useIntervalFn(() => {
  if (!typed.value) placeholderIndex.value = (placeholderIndex.value + 1) % examples.length
}, 5000)

function acceptPlaceholder(event: KeyboardEvent) {
  if (typed.value) return
  event.preventDefault()
  typed.value = placeholder.value
}

const searchInput = useTemplateRef('searchInput')
/** The empty box offers `/` to reach it and, once there, Tab to take the placeholder. */
const focused = ref(false)
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
    ].filter(group => group.items.length)
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

/** A name search that found nothing is most likely a sentence, and the parser is one key away. */
const emptyState = computed(() => {
  if (count.value) {
    return {
      title: 'Nothing comes close',
      description: `No tool satisfies ${count.value > 2 ? 'most of' : ''} what you picked${hidden.value ? `, ${hidden.value} miss three requirements or more` : ''}. Drop one and try again.`,
      actions: [{ label: 'Reset requirements', color: 'neutral' as const, variant: 'outline' as const, onClick: reset }]
    }
  }
  return {
    title: 'No tool is called that',
    description: 'Press Enter to turn it into filters instead.',
    actions: [{ label: 'Ask', icon: 'i-lucide-sparkles', color: 'neutral' as const, variant: 'outline' as const, loading: asking.value, onClick: ask }]
  }
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
        <h1 class="sr-only">
          Find the AI coding tool that fits how you work
        </h1>

        <p class="text-sm text-muted">
          {{ summary }}
          <ULink
            v-if="guide"
            :to="guide.to"
            class="text-highlighted underline underline-offset-4"
          >{{ guide.label }}</ULink>
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
          <form
            class="flex-1"
            @submit.prevent="ask"
          >
            <UInput
              ref="searchInput"
              v-model="search"
              icon="i-lucide-search"
              :placeholder="placeholder"
              class="w-full"
              :maxlength="300"
              autofocus
              :ui="{ trailing: 'pe-1.5' }"
              @keydown.tab.exact="acceptPlaceholder"
              @keydown.right.exact="acceptPlaceholder"
              @focus="focused = true"
              @blur="focused = false"
            >
              <template #trailing>
                <UButton
                  v-if="askable"
                  type="submit"
                  label="Ask"
                  icon="i-lucide-sparkles"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  :loading="asking"
                />
                <UKbd
                  v-else-if="!focused || !typed"
                  :value="focused ? 'tab' : '/'"
                />
                <span v-else />
              </template>
            </UInput>
          </form>

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

        <div
          v-if="plain && !typed"
          class="flex flex-wrap items-center gap-1.5"
        >
          <UButton
            v-for="example in examples"
            :key="example"
            :label="example"
            color="neutral"
            variant="soft"
            size="xs"
            class="rounded-full font-normal"
            :disabled="asking"
            @click="useExample(example)"
          />
        </div>

        <UAlert
          v-if="why"
          color="neutral"
          variant="soft"
          icon="i-lucide-sparkles"
          :title="why"
          description="The filters on the left reflect that. Adjust them if something is off."
          :ui="{ title: 'font-medium', description: 'text-toned' }"
          close
          @update:open="reset"
        />

        <template v-if="matches.length && (exact.length || close.length || !count)">
          <!-- Two rows of the three-column grid are in view on load; the rest stays lazy. -->
          <ToolMatchList
            v-for="(group, index) in grouped"
            :key="group.key"
            :title="group.title"
            :description="group.description"
            :items="group.items"
            :eager="index === 0 ? 6 : 0"
          />
        </template>

        <UEmpty
          v-else
          icon="i-lucide-search-x"
          :title="emptyState.title"
          :description="emptyState.description"
          :actions="[
            ...emptyState.actions,
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
