<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { site } = useAppConfig()

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Explore', to: '/tools' },
  { label: 'Compare', to: '/compare' },
  { label: 'API', to: '/api/tools.json', target: '_blank' },
  { label: 'GitHub', to: `https://github.com/${site.repo}`, target: '_blank' }
])
</script>

<template>
  <UHeader to="/">
    <template #title>
      <AppLogo />
    </template>

    <UNavigationMenu
      :items="items"
      color="neutral"
      variant="link"
      :highlight="false"
      class="hidden sm:flex"
    />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        color="neutral"
        variant="pill"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
