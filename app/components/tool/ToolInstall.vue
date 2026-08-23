<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { Tool } from '#shared/schema'

defineProps<{
  install: Tool['install']
}>()

const { copy, copied } = useClipboard()
const last = ref('')

function onCopy(command: string) {
  last.value = command
  copy(command)
}
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="entry in install"
      :key="entry.command ?? entry.url"
      class="flex items-center gap-3 rounded-lg border border-default bg-white dark:bg-muted px-3 py-2"
    >
      <span class="w-16 shrink-0 font-mono text-xs uppercase tracking-wider text-muted">{{ entry.method }}</span>
      <template v-if="entry.command">
        <code class="flex-1 min-w-0 truncate font-mono text-sm text-highlighted">{{ entry.command }}</code>
        <UButton
          :icon="copied && last === entry.command ? 'i-lucide-check' : 'i-lucide-copy'"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Copy command"
          @click="onCopy(entry.command)"
        />
      </template>
      <ULink
        v-else
        :to="entry.url"
        target="_blank"
        class="flex-1 min-w-0 truncate font-mono text-sm text-highlighted hover:underline"
      >
        {{ entry.url }}
      </ULink>
    </li>
  </ul>
</template>
