<script setup lang="ts">
const { site } = useAppConfig()

useHead({
  htmlAttrs: { lang: 'en' },
  titleTemplate: title => title ? `${title} · ${site.name}` : site.name
})

useSeoMeta({
  ogSiteName: site.name,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :height="2"
      color="var(--ui-text-highlighted)"
    />

    <AppHeader />

    <UMain>
      <NuxtPage />
    </UMain>

    <AppFooter />
  </UApp>
</template>
