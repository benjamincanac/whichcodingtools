<script setup lang="ts">
import { CHANGES_INDEX, CHANGES_INTRO } from '#shared/content/pages'
import { changeDate } from '#shared/utils/changelog'
import type { ChangeCommit } from '~~/server/utils/changes'

const { data } = await useFetch<{ count: number, changes: ChangeCommit[] }>('/api/changes.json', {
  key: 'changes',
  default: () => ({ count: 0, changes: [] })
})

const changes = computed(() => data.value?.changes ?? [])

useSeoMeta(CHANGES_INDEX)

useHead({
  link: [{ rel: 'alternate', type: 'application/atom+xml', title: 'whichcoding.tools changes', href: '/changes.xml' }]
})

defineOgImage('ToolSatori', {
  headline: 'Changes',
  title: CHANGES_INDEX.title,
  description: 'Price, tier, plan and status changes across the directory, derived from the data.',
  meta: 'Atom feed at /changes.xml'
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="CHANGES_INDEX.title"
        :description="CHANGES_INTRO"
        :links="[
          { label: 'Atom feed', to: '/changes.xml', target: '_blank', icon: 'i-lucide-rss', color: 'neutral', variant: 'solid' },
          { label: 'JSON', to: '/api/changes.json', target: '_blank', icon: 'i-lucide-braces', color: 'neutral', variant: 'outline' }
        ]"
      />

      <UPageBody>
        <ol
          v-if="changes.length"
          class="flex flex-col gap-6"
        >
          <li
            v-for="entry in changes"
            :key="entry.sha"
            class="flex flex-col sm:flex-row gap-3 sm:gap-6"
          >
            <div class="sm:w-40 shrink-0 flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0.5">
              <time
                :datetime="entry.date"
                class="text-sm text-highlighted whitespace-nowrap"
              >{{ changeDate(entry.date) }}</time>
              <ULink
                :to="entry.url"
                target="_blank"
                class="font-mono text-xs text-muted"
              >{{ entry.sha.slice(0, 7) }}</ULink>
            </div>

            <div class="flex flex-col gap-3 min-w-0 flex-1 border-s border-default ps-4 sm:ps-6">
              <div
                v-for="tool in entry.tools"
                :key="tool.slug"
                class="flex flex-col gap-1"
              >
                <ULink
                  :to="`/tools/${tool.slug}`"
                  class="font-medium text-highlighted"
                >{{ tool.name }}</ULink>
                <ul class="list-disc ps-4 text-sm text-toned marker:text-dimmed">
                  <li
                    v-for="line in tool.lines"
                    :key="line"
                  >
                    {{ line }}
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ol>

        <UEmpty
          v-else
          icon="i-lucide-git-commit-horizontal"
          title="No changes to show"
          description="Nothing in the recent history of content/tools changed a value. Either the sweeps found nothing to correct, or the history could not be read."
          :actions="[{ label: 'Every tool', to: '/tools', color: 'neutral', variant: 'outline' }]"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
