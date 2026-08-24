<script setup lang="ts">
import type { ToolRecord } from '#shared/types/tool'

/**
 * Slugs with a committed logo, resolved at build time. Passing a src that 404s is not an
 * option: the img error can fire before hydration, so UAvatar's fallback never kicks in.
 */
const logos = new Set(Object.keys(import.meta.glob('../../../public/logos/*.png')).map(path => path.split('/').pop()!.replace('.png', '')))

withDefaults(defineProps<{
  tool: Pick<ToolRecord, 'slug' | 'name' | 'icon'>
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>(), { size: 'md' })
</script>

<template>
  <UAvatar
    :src="logos.has(tool.slug) ? `/logos/${tool.slug}.png` : undefined"
    :icon="tool.icon"
    :text="tool.name.slice(0, 1)"
    :alt="tool.name"
    :size="size"
    class="bg-elevated text-highlighted font-medium ring-1 ring-default"
    :ui="{ icon: 'text-highlighted' }"
  />
</template>
