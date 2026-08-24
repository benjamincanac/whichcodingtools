<script setup lang="ts">
import type { ChangelogEntry } from '~~/server/utils/changelog'

const { site } = useAppConfig()
const { bySlug, ready } = useTools()
await ready
const { data } = await useFetch<{ generated_at: string, entries: ChangelogEntry[] }>('/api/changelog.json', { key: 'changelog' })

const days = computed(() => {
  const map = new Map<string, ChangelogEntry[]>()
  for (const entry of data.value?.entries ?? []) {
    map.set(entry.date, [...(map.get(entry.date) ?? []), entry])
  }
  return [...map.entries()]
})

const icons = { added: 'i-lucide-plus', modified: 'i-lucide-pencil', removed: 'i-lucide-minus', renamed: 'i-lucide-arrow-right' }

useSeoMeta({
  title: 'Changelog',
  description: 'Every change to the tool data, straight from git history. Added tools, price updates and renames with the commit that made them.'
})

defineOgImage('ToolSatori', {
  headline: 'Changelog',
  title: 'Every change to the data',
  description: 'Additions, price updates and renames, straight from the git history of content/tools.'
})
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Changelog"
      description="Every change to the tool data, straight from git history. The site has no other edit path."
      :ui="{ root: 'py-8 lg:py-12' }"
    />
    <div class="flex flex-col gap-10 pb-16 max-w-3xl">
      <section
        v-for="[date, entries] in days"
        :key="date"
        class="flex flex-col gap-3"
      >
        <h2 class="font-mono text-sm text-muted">
          {{ date }}
        </h2>
        <ul class="flex flex-col divide-y divide-default rounded-lg border border-default bg-white dark:bg-muted">
          <li
            v-for="entry in entries"
            :key="entry.sha"
            class="flex flex-col gap-2 px-4 py-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-highlighted">{{ entry.subject }}</span>
              <ULink
                :to="`https://github.com/${site.repo}/commit/${entry.sha}`"
                target="_blank"
                class="font-mono text-xs text-muted hover:text-highlighted"
              >
                {{ entry.sha.slice(0, 7) }}
              </ULink>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="change in entry.changes"
                :key="change.slug + change.status"
                :to="bySlug.get(change.slug) ? `/tools/${change.slug}` : undefined"
                color="neutral"
                variant="outline"
                size="sm"
                class="rounded-full"
                :icon="icons[change.status]"
              >
                {{ bySlug.get(change.slug)?.name ?? change.slug }}
              </UBadge>
            </div>
          </li>
        </ul>
      </section>
      <UEmpty
        v-if="!days.length"
        icon="i-lucide-git-commit-horizontal"
        title="No history available"
        description="The build ran in a shallow clone. Set VERCEL_DEEP_CLONE=true or fetch-depth: 0 so git log can see content/tools."
      />
    </div>
  </UContainer>
</template>
