<script setup lang="ts">
const route = useRoute()
const { site } = useAppConfig()
const { siteUrl, rawPrefix } = useRuntimeConfig().public.agentDiscovery
const colorMode = useColorMode()

const themeColor = computed(() => colorMode.value === 'dark' ? 'black' : '#fafafa')

/**
 * The markdown twin of the current page, so a client that reads the HTML can find it without
 * negotiating. Not `useCanonical()` from the agent module: `nuxt-seo-utils` already emits the
 * canonical link on every page and the two would fight over it.
 */
const markdownAlternate = computed(() => route.path === '/'
  ? `${siteUrl}${rawPrefix}/index.md`
  : `${siteUrl}${route.path}.md`)

useHead({
  htmlAttrs: { lang: 'en' },
  titleTemplate: title => title ? `${title} · ${site.name}` : site.name,
  meta: [
    { name: 'color-scheme', content: 'light dark' },
    { key: 'theme-color', name: 'theme-color', content: themeColor }
  ],
  link: () => [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'alternate', type: 'text/markdown', href: markdownAlternate.value }
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

    <AppFooter />
  </UApp>
</template>
