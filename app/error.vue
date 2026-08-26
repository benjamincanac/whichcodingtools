<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="error" />
  </UApp>
</template>
