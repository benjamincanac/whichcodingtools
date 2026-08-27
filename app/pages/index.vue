<script setup lang="ts">
import type { ParsedRequirements } from '#shared/finder'
import { toRequirements } from '#shared/finder'
import { toQuery } from '~/composables/useToolFinder'

const { site } = useAppConfig()
const { public: { finderAi } } = useRuntimeConfig()
const { tools, ready } = useTools()
await ready

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
const error = ref('')

const examples = [
  'Terminal agent on Linux, I already pay for Claude Max',
  'Inside VS Code with open source local models',
  'Parallel agents with worktrees, free and open source',
  'Goes through Vercel AI Gateway',
  'Cloud agent I can trigger from a ticket'
]

async function go() {
  const text = query.value.trim()
  if (loading.value) return
  if (!finderAi || !text.length) {
    return navigateTo({ path: '/tools', query: { q: text } })
  }
  loading.value = true
  error.value = ''
  try {
    const { parsed } = await $fetch<{ parsed: ParsedRequirements }>('/api/finder/parse', { method: 'POST', body: { query: text } })
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
      headline: 'flex',
      title: 'text-4xl sm:text-5xl font-medium tracking-tighter',
      description: 'text-base sm:text-lg max-w-xl mx-auto text-pretty',
      links: ''
    }"
  >
    <template #headline>
      <span class="flex size-12 items-center justify-center rounded-xl bg-inverted text-inverted font-mono text-lg">&gt;_</span>
    </template>

    <template
      v-if="finderAi"
      #links
    >
      <form
        class="w-full max-w-2xl flex flex-col gap-3"
        @submit.prevent="go"
      >
        <UInput
          ref="input"
          v-model="query"
          :placeholder="finderAi ? 'Goes through Vercel AI Gateway' : 'Search tools by name'"
          size="xl"
          class="w-full max-w-xl mx-auto"
          :disabled="loading"
          :maxlength="67"
          autofocus
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
        <p
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </p>
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

    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted py-4 mt-auto">
      <ULink
        to="/tools"
      >
        Explore {{ tools.length }} tools
      </ULink>
      <span>·</span>
      <ULink
        to="/compare"
      >
        Compare
      </ULink>
      <span>·</span>
      <ULink
        to="/api/tools.json"
        target="_blank"
      >
        JSON API
      </ULink>
      <span>·</span>
      <ULink
        :to="`https://github.com/${site.repo}/tree/main/content/tools`"
        target="_blank"
      >No affiliate links. Data is open, in git.</ULink>
    </div>
  </UPageHero>
</template>
