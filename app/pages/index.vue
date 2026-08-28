<script setup lang="ts">
import type { ParsedRequirements } from '#shared/finder'
import { useIntervalFn } from '@vueuse/core'
import { API_BASE } from '#shared/api'
import { toRequirements } from '#shared/finder'
import { toQuery } from '~/composables/useToolFinder'

const { site } = useAppConfig()

useSeoMeta({
  title: 'Find the AI coding tool that fits how you work',
  description: `Every editor, terminal agent, orchestrator and cloud agent, with pricing verified against vendor pages. Tell ${site.name} what you need and get the best fit.`
})

defineOgImage('ToolSatori', {
  headline: 'AI coding tools',
  title: 'Find the AI coding tool that fits how you work',
  description: 'Editors, terminal agents, orchestrators and cloud agents with verified pricing and the graph of what runs what.'
})

const query = ref('')
const loading = ref(false)

const examples = [
  'Runs on Vercel AI Gateway, one key for every model',
  'Terminal agent on macOS, I already pay for Claude Max',
  'Inside VS Code with open source local models',
  'An IDE with the agent built in, checkpoints to roll back',
  'Parallel agents with worktrees, free and open source',
  'Cloud agent I can trigger from a ticket'
]

async function go() {
  const text = query.value.trim()
  if (loading.value) return
  if (!text.length) {
    return navigateTo({ path: '/tools', query: { q: text } })
  }
  loading.value = true
  try {
    const { parsed } = await $fetch<{ parsed: ParsedRequirements }>(`${API_BASE}/finder/parse`, { method: 'POST', body: { query: text } })
    await navigateTo({ path: '/tools', query: { ...toQuery(toRequirements(parsed)), why: parsed.summary } })
  } catch {
    // The model is unavailable: fall back to a plain text search so the input still does something.
    await navigateTo({ path: '/tools', query: { q: text } })
  } finally {
    loading.value = false
  }
}

function useExample(text: string) {
  query.value = text
  go()
}

// The placeholder cycles through the examples while the field is empty. Tab, or ArrowRight as the
// shell convention, accepts the one on screen. With text in the field both keys keep their default,
// so the form stays reachable by keyboard.
const placeholderIndex = ref(0)
const placeholder = computed(() => examples[placeholderIndex.value]!)
useIntervalFn(() => {
  if (!query.value) placeholderIndex.value = (placeholderIndex.value + 1) % examples.length
}, 5000)

function acceptPlaceholder(event: KeyboardEvent) {
  if (query.value) return
  event.preventDefault()
  query.value = placeholder.value
}

const input = useTemplateRef('input')
defineShortcuts({
  '/': () => input.value?.inputRef?.focus()
})
</script>

<template>
  <UPageHero
    :title="site.name"
    description="Tell it how you work. It finds the AI coding tool that fits, with pricing checked against the vendor page."
    :ui="{
      root: 'flex flex-col min-h-[calc(100vh-var(--ui-header-height))]',
      container: 'flex-1 flex flex-col lg:flex',
      headline: 'flex',
      title: 'text-4xl sm:text-5xl font-medium tracking-tighter',
      description: 'text-base sm:text-lg max-w-xl mx-auto text-pretty'
    }"
  >
    <!-- <template #top>
      <DotPanels class="absolute inset-0 -top-(--ui-header-height) -z-1 opacity-25" />
    </template> -->

    <template #headline>
      <span class="flex size-12 items-center justify-center rounded-xl bg-inverted text-inverted font-mono text-lg">&gt;_</span>
    </template>

    <template #links>
      <form
        class="w-full max-w-2xl flex flex-col gap-3"
        @submit.prevent="go"
      >
        <UInput
          ref="input"
          v-model="query"
          :placeholder="placeholder"
          size="xl"
          class="w-full max-w-xl mx-auto"
          :disabled="loading"
          :maxlength="67"
          autofocus
          @keydown.tab.exact="acceptPlaceholder"
          @keydown.right.exact="acceptPlaceholder"
        >
          <template #trailing>
            <UButton
              type="submit"
              aria-label="Submit search"
              color="neutral"
              variant="soft"
              size="sm"
              trailing
              trailing-icon="i-lucide-chevron-right"
              :loading="loading"
              class="-me-1.5"
            />
          </template>
        </UInput>
      </form>

      <div class="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto">
        <UButton
          v-for="example in examples"
          :key="example"
          :label="example"
          color="neutral"
          variant="soft"
          size="xs"
          class="rounded-full font-normal"
          @click="useExample(example)"
        />
      </div>
    </template>

    <!-- In flow under the wrapper, so it can never overlap the form. The negative margin eats the container padding down to the same offsets on every breakpoint. -->
    <p class="mt-auto -mb-20 sm:-mb-26 lg:-mb-32 text-[13px] text-dimmed text-pretty text-center">
      Every price, plan and limit comes from a vendor page someone read on the date recorded next to it.<br class="hidden sm:block"> One YAML file per tool, validated against a schema, with a source URL on every claim. <ULink
        :to="`https://github.com/${site.repo}/tree/main/content/tools`"
        target="_blank"
      >No affiliate links, data on GitHub.</ULink>
    </p>
  </UPageHero>
</template>
