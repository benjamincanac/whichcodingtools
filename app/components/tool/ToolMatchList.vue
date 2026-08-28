<script setup lang="ts">
import type { ToolMatch } from '~/composables/useToolFinder'

withDefaults(defineProps<{
  title?: string
  description?: string
  items: ToolMatch[]
  /** How many leading cards sit above the fold and load their logo eagerly. */
  eager?: number
}>(), { eager: 0 })
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
        v-for="(item, index) in items"
        :key="item.tool.slug"
        :tool="item.tool"
        :match="item.match"
        :eager="index < eager"
      />
    </UPageGrid>
  </section>
</template>
