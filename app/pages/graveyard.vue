<script setup lang="ts">
import { LAYERS, optionLabel } from '#shared/enums'
import { GRAVEYARD_GROUPS, GRAVEYARD_INDEX, GRAVEYARD_INTRO } from '#shared/content/pages'
import { graveyardEntries, graveyardGroups, graveyardHeadline, monthYear } from '#shared/utils/graveyard'

const { tools, bySlug, ready } = useTools()
await ready

const entries = computed(() => graveyardEntries(tools.value, bySlug.value))
const groups = computed(() => graveyardGroups(entries.value))

useSeoMeta(GRAVEYARD_INDEX)

defineOgImage('ToolSatori', {
  headline: 'Graveyard',
  title: GRAVEYARD_INDEX.title,
  description: 'Discontinued tools, announced end dates and renames, with where each product\'s users were pointed.',
  meta: `${entries.value.length} entries`
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="GRAVEYARD_INDEX.title"
        :description="GRAVEYARD_INTRO"
        :links="[{ label: 'Every tool', to: '/tools', icon: 'i-lucide-list', color: 'neutral', variant: 'outline' }]"
      />

      <UPageBody>
        <section
          v-for="group in groups"
          :key="group.kind"
          class="flex flex-col gap-4"
        >
          <div>
            <h2 class="text-xl font-medium tracking-tight text-highlighted">
              {{ GRAVEYARD_GROUPS[group.kind].title }}
              <span class="text-muted font-normal">({{ group.entries.length }})</span>
            </h2>
            <p class="text-sm text-muted">
              {{ GRAVEYARD_GROUPS[group.kind].description }}
            </p>
          </div>

          <ul class="flex flex-col divide-y divide-default rounded-lg border border-default bg-elevated/50">
            <li
              v-for="entry in group.entries"
              :key="entry.tool.slug"
              class="flex flex-col sm:flex-row sm:items-start gap-3 px-4 py-4"
            >
              <ToolAvatar
                :tool="entry.tool"
                size="lg"
              />

              <div class="flex flex-col gap-1.5 min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <ULink
                    :to="`/tools/${entry.tool.slug}`"
                    class="font-medium text-highlighted"
                  >
                    {{ entry.tool.name }}
                  </ULink>
                  <UBadge
                    :to="`/layers/${entry.tool.layer}`"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    class="rounded-full"
                  >
                    {{ optionLabel(LAYERS, entry.tool.layer) }}
                  </UBadge>
                  <span class="text-xs text-muted">{{ entry.tool.vendor }}</span>
                </div>

                <p class="text-sm text-toned">
                  {{ graveyardHeadline(entry) }}
                </p>

                <p class="text-sm text-muted">
                  {{ entry.tool.description }}
                </p>

                <!-- Every name it has been, so a chain reads as one lineage rather than two hops. -->
                <div
                  v-if="entry.chain && entry.chain.length > 1"
                  class="flex flex-wrap items-center gap-1.5 pt-0.5"
                >
                  <template
                    v-for="(name, index) in entry.chain"
                    :key="name.slug"
                  >
                    <UIcon
                      v-if="index > 0"
                      name="i-lucide-arrow-right"
                      class="size-3.5 text-dimmed"
                    />
                    <UTooltip :text="name.until ? `Used until ${name.until}` : 'Current name'">
                      <UBadge
                        color="neutral"
                        :variant="name.until ? 'soft' : 'outline'"
                        size="sm"
                        class="rounded-full"
                      >
                        {{ name.name }}
                      </UBadge>
                    </UTooltip>
                  </template>
                </div>
              </div>

              <div class="flex flex-row sm:flex-col sm:items-end items-center gap-2 shrink-0">
                <span class="text-xs text-muted whitespace-nowrap">{{ monthYear(entry.date) }}</span>
                <UButton
                  v-if="entry.successor"
                  :label="`Go to ${entry.successor.name}`"
                  :to="`/tools/${entry.successor.slug}`"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  trailing-icon="i-lucide-arrow-right"
                />
              </div>
            </li>
          </ul>
        </section>

        <UEmpty
          v-if="!groups.length"
          icon="i-lucide-archive"
          title="Nothing here yet"
          description="No tool in the directory is discontinued or has been renamed."
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
