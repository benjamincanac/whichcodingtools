<script setup lang="ts">
import type { ToolMatch } from '~/composables/useToolFinder'

defineProps<{
  title?: string
  description?: string
  items: ToolMatch[]
}>()
</script>

<template>
  <section
    v-if="items.length"
    class="flex flex-col gap-4"
  >
    <div v-if="title">
      <h2 class="text-base font-medium tracking-tight text-highlighted">
        {{ title }}
        <span class="text-muted font-normal">({{ items.length }})</span>
      </h2>
      <p
        v-if="description"
        class="text-sm text-muted"
      >
        {{ description }}
      </p>
    </div>
    <UPageGrid class="gap-4">
      <ToolCard
        v-for="item in items"
        :key="item.tool.slug"
        :tool="item.tool"
        :match="item.match"
      />
    </UPageGrid>
  </section>
</template>
