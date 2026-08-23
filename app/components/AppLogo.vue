<script setup lang="ts">
const { site } = useAppConfig()
</script>

<template>
  <span class="inline-flex items-center gap-2 font-medium tracking-tight text-highlighted">
    <span class="flex size-6 items-center justify-center rounded-md bg-inverted text-inverted font-mono text-xs">&gt;_</span>
    {{ site.name }}
  </span>
</template>
