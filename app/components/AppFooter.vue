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
