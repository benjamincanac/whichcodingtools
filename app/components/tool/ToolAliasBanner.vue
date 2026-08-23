<script setup lang="ts">
import type { ToolAlias } from '#shared/schema'

defineProps<{
  name: string
  aliases: ToolAlias[]
}>()

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
</script>

<template>
  <UAlert
    v-for="alias in aliases"
    :key="alias.slug"
    color="neutral"
    variant="subtle"
    icon="i-lucide-history"
    :title="`Formerly ${alias.name}, renamed ${formatDate(alias.until)}`"
    :description="alias.note"
    :ui="{ title: 'font-medium', description: 'text-toned' }"
  />
</template>
