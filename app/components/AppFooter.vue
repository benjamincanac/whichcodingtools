<script setup lang="ts">
const { site } = useAppConfig()
</script>

<template>
  <UFooter>
    <template #left>
      No affiliate links. No sponsored placement. Data is open and lives in git.
    </template>

    <template #right>
      <UButton
        :to="`https://github.com/${site.repo}`"
        target="_blank"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="GitHub"
      />
      <UColorModeButton size="sm" />
    </template>
  </UFooter>
</template>
