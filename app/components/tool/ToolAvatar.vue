<script setup lang="ts">
import type { ToolRecord } from '#shared/types/tool'

withDefaults(defineProps<{
  tool: Pick<ToolRecord, 'slug' | 'name' | 'icon'>
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>(), { size: 'md' })
</script>

<template>
  <UAvatar
    :src="`/logos/${tool.slug}.png`"
    :icon="tool.icon"
    :text="tool.name.slice(0, 1)"
    :alt="tool.name"
    :size="size"
    class="bg-elevated text-highlighted font-medium ring-1 ring-default"
    :ui="{ icon: 'text-highlighted' }"
  />
</template>
