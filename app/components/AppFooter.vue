<script setup lang="ts">
const { site } = useAppConfig()

const year = new Date().getFullYear()
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">
        © {{ year }} {{ site.name }}
      </p>
    </template>

    <p class="text-sm text-muted text-center text-pretty">
      Prices read off vendor pages on the date shown. <ULink
        :to="`https://github.com/${site.repo}/tree/main/content/tools`"
        target="_blank"
        class="text-highlighted underline underline-offset-4"
      >No affiliate links, data on GitHub.</ULink>
    </p>

    <template #right>
      <UButton
        icon="i-simple-icons-vercel"
        label="Deployed on Vercel"
        to="https://vercel.com"
        target="_blank"
        color="neutral"
        variant="outline"
        size="sm"
      />
    </template>
  </UFooter>
</template>
