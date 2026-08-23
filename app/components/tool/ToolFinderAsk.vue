<script setup lang="ts">
import type { ParsedRequirements } from '#shared/finder'
import { toRequirements } from '#shared/finder'
import type { Requirements } from '#shared/utils/match'

const emit = defineEmits<{
  apply: [requirements: Requirements]
}>()

const query = ref('')
const loading = ref(false)
const summary = ref('')
const error = ref('')

const examples = [
  'Terminal agent on Linux, I already pay for Claude Max',
  'Something inside VS Code that works with local models',
  'Run several agents in parallel with worktrees, free and open source',
  'Goes through Vercel AI Gateway'
]

async function ask() {
  const text = query.value.trim()
  if (text.length < 3 || loading.value) return
  loading.value = true
  error.value = ''
  summary.value = ''
  try {
    const { parsed } = await $fetch<{ parsed: ParsedRequirements }>('/api/finder/parse', { method: 'POST', body: { query: text } })
    summary.value = parsed.summary
    emit('apply', toRequirements(parsed))
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    error.value = status === 503 ? 'Not available on this deployment.' : 'Could not read that, try the filters on the left.'
  } finally {
    loading.value = false
  }
}

function useExample(text: string) {
  query.value = text
  ask()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <form
      class="flex gap-2"
      @submit.prevent="ask"
    >
      <UInput
        v-model="query"
        icon="i-lucide-sparkles"
        placeholder="Describe how you work, in your own words"
        size="lg"
        class="flex-1"
        :loading="loading"
        :disabled="loading"
        maxlength="300"
      />
      <UButton
        type="submit"
        label="Find"
        color="neutral"
        size="lg"
        :loading="loading"
        :disabled="query.trim().length < 3"
      />
    </form>
    <p
      v-if="summary"
      class="text-sm text-toned"
    >
      <UIcon
        name="i-lucide-check"
        class="size-4 align-text-bottom text-success"
      />
      {{ summary }} The filters on the left now reflect that, adjust them if something is off.
    </p>
    <p
      v-else-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>
    <div
      v-else
      class="flex flex-wrap gap-1.5"
    >
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
  </div>
</template>
