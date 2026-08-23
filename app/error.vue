<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp>
    <AppHeader />

    <UMain>
      <UContainer class="py-24">
        <UEmpty
          :title="String(error.statusCode)"
          :description="error.statusMessage || error.message"
          :actions="[{ label: 'Back to the finder', to: '/', color: 'neutral' }]"
        />
      </UContainer>
    </UMain>

    <AppFooter />
  </UApp>
</template>
