<script setup lang="ts">
import { CRAWLER_PAGE } from '#shared/content/crawler'

useSeoMeta({
  title: CRAWLER_PAGE.title,
  description: CRAWLER_PAGE.description
})

defineOgImage('ToolSatori', {
  headline: 'Crawler',
  title: 'What the agent reads, and how to reach a person about it',
  description: CRAWLER_PAGE.description
})

/**
 * The one bit of markup in the prose: the user agent and the robots tokens are code. Split on
 * the backticks, so the odd segments are code and nothing goes through `v-html`.
 */
function segments(text: string): { code: boolean, text: string }[] {
  return text.split('`').map((part, i) => ({ code: i % 2 === 1, text: part })).filter(s => s.text)
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="CRAWLER_PAGE.title"
        :description="CRAWLER_PAGE.description"
      />

      <UPageBody class="max-w-2xl">
        <section
          v-for="section in CRAWLER_PAGE.sections"
          :key="section.title"
          class="mb-10"
        >
          <h2 class="text-xl font-medium tracking-tight text-highlighted mb-3">
            {{ section.title }}
          </h2>
          <p
            v-for="paragraph in section.paragraphs"
            :key="paragraph"
            class="text-muted mb-3 text-pretty"
          >
            <template
              v-for="(segment, i) in segments(paragraph)"
              :key="i"
            >
              <code
                v-if="segment.code"
                class="font-mono text-sm text-highlighted"
              >{{ segment.text }}</code>
              <span v-else>{{ segment.text }}</span>
            </template>
          </p>
        </section>

        <section>
          <h2 class="text-xl font-medium tracking-tight text-highlighted mb-3">
            {{ CRAWLER_PAGE.contact.title }}
          </h2>
          <p class="text-muted mb-4 text-pretty">
            {{ CRAWLER_PAGE.contact.text }}
          </p>
          <UButton
            :to="CRAWLER_PAGE.contact.href"
            target="_blank"
            icon="i-simple-icons-github"
            color="neutral"
            variant="subtle"
            :label="CRAWLER_PAGE.contact.label"
          />
        </section>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
