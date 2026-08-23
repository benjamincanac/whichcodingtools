<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { site } = useAppConfig()

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Tools', to: '/tools' },
  { label: 'Compare', to: '/compare' },
  { label: 'Changelog', to: '/changelog' },
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
      <UButton
        :to="`https://github.com/${site.repo}`"
        target="_blank"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        aria-label="GitHub"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        color="neutral"
        variant="link"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
