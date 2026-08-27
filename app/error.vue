<script setup lang="ts">
import type { NuxtError } from '#app'
import { RECOVERY_DOCUMENTS, RECOVERY_PAGES } from '#shared/content/recovery'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp>
    <AppHeader />

    <UError :error="error">
      <template #links>
        <div class="flex flex-col items-center gap-4">
          <UButton
            size="lg"
            label="Back to home"
            @click="clearError({ redirect: '/' })"
          />

          <nav
            aria-label="Where to look next"
            class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted"
          >
            <ULink
              v-for="link in RECOVERY_PAGES"
              :key="link.to"
              :to="link.to"
              :target="link.external ? '_blank' : undefined"
              :external="link.external"
            >
              {{ link.label }}
            </ULink>
          </nav>

          <!-- An agent that asked for HTML gets this page rather than the markdown error body,
               so the entry points that body lists are here too. -->
          <p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-dimmed">
            <span>Every page is also Markdown: append <code>.md</code> or send <code>Accept: text/markdown</code>.</span>
            <ULink
              v-for="link in RECOVERY_DOCUMENTS"
              :key="link.to"
              :to="link.to"
              target="_blank"
              external
            >
              {{ link.label }}
            </ULink>
          </p>
        </div>
      </template>
    </UError>
  </UApp>
</template>
