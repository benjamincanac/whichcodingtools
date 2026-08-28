<script setup lang="ts">
import { LAYERS, PLATFORMS, optionLabel } from '#shared/enums'
import type { ToolSummary } from '#shared/types/tool'
import { deltaLabel, type MatchResult } from '#shared/utils/match'
import { entryPriceLabel } from '#shared/utils/pricing'

const props = defineProps<{
  tool: ToolSummary
  match?: MatchResult
  /** Above the fold: the logo loads with the page instead of waiting for the lazy threshold. */
  eager?: boolean
}>()

const platforms = computed(() => PLATFORMS.filter(p => props.tool.platforms.includes(p.value)))
const delta = computed(() => deltaLabel(props.match))
const price = computed(() => entryPriceLabel(props.tool))
</script>

<template>
  <UPageCard
    :to="`/tools/${tool.slug}`"
    variant="outline"
    class="min-w-0"
    :ui="{ root: 'overflow-hidden', container: 'gap-y-3 p-4 sm:p-5', wrapper: 'gap-3 min-w-0 max-w-full items-stretch', title: 'flex items-center gap-2', description: 'line-clamp-3', leading: 'mb-0' }"
  >
    <template #leading>
      <div class="flex w-full items-start justify-between gap-3 min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          <ToolAvatar
            :tool="tool"
            :eager="eager"
          />
          <div class="min-w-0">
            <p class="font-medium tracking-tight text-highlighted leading-tight">
              {{ tool.name }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ tool.vendor }}
            </p>
          </div>
        </div>
        <UBadge
          color="neutral"
          variant="soft"
          size="sm"
          class="rounded-full shrink-0 mt-0.5 ms-auto"
          :label="optionLabel(LAYERS, tool.layer)"
        />
      </div>
    </template>

    <template #description>
      {{ tool.description }}
    </template>

    <template #footer>
      <div class="flex flex-col gap-3 w-full">
        <div
          v-if="match && (delta || match.missing.length)"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-if="delta"
            color="neutral"
            variant="soft"
            size="sm"
            class="rounded-full"
            icon="i-lucide-wallet"
          >
            {{ delta }}
          </UBadge>
          <UBadge
            v-for="miss in match.missing"
            :key="miss"
            color="warning"
            variant="subtle"
            size="sm"
            class="rounded-full"
            icon="i-lucide-x"
          >
            {{ miss }}
          </UBadge>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-xs text-muted">
          <div class="flex items-center gap-1.5 min-w-0">
            <UTooltip
              v-for="platform in platforms"
              :key="platform.value"
              :text="platform.label"
            >
              <UIcon
                :name="platform.icon!"
                class="size-3.5"
              />
            </UTooltip>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono text-highlighted whitespace-nowrap">{{ price }}</span>
            <ToolFreshness
              :freshness="tool.freshness"
              variant="dot"
            />
          </div>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
