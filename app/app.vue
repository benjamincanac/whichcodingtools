<script setup lang="ts">
const { site } = useAppConfig()

useHead({
  htmlAttrs: { lang: 'en' },
  titleTemplate: title => title ? `${title} · ${site.name}` : site.name,
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
  ]
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
  </UApp>
</template>
