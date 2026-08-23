<script setup lang="ts">
import { LAYERS, PLATFORMS, optionLabel } from '#shared/enums'
import type { ToolRecord } from '#shared/types/tool'
import { deltaLabel, type MatchResult } from '#shared/utils/match'

const props = defineProps<{
  tool: ToolRecord
  match?: MatchResult
}>()

const platforms = computed(() => PLATFORMS.filter(p => props.tool.platforms.includes(p.value)))
const delta = computed(() => deltaLabel(props.match))
const price = computed(() => {
  if (props.tool.entry_price === null) return props.tool.pricing_model === 'usage' ? 'Usage-based' : null
  if (props.tool.entry_price > 0) return `From $${props.tool.entry_price}/mo`
  return props.tool.pricing_model === 'free' ? 'Free' : 'Free tier'
})
</script>

<template>
  <UPageCard
    :to="`/tools/${tool.slug}`"
    variant="outline"
    :ui="{ container: 'gap-y-3 p-4 sm:p-5', wrapper: 'gap-3', title: 'flex items-center gap-2', description: 'line-clamp-3' }"
  >
    <template #leading>
      <div class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <ToolAvatar :tool="tool" />
          <div class="min-w-0">
            <p class="font-medium tracking-tight text-highlighted truncate">
              {{ tool.name }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ tool.vendor }}
            </p>
          </div>
        </div>
        <UBadge
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full shrink-0"
        >
          {{ optionLabel(LAYERS, tool.layer) }}
        </UBadge>
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
        <div class="flex items-center justify-between gap-3 text-xs text-muted">
          <div class="flex items-center gap-1.5">
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
            <span
              v-if="tool.open_source"
              class="ml-1 font-mono"
            >{{ tool.license.spdx.split(' ')[0] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="price"
              class="font-mono text-highlighted"
            >{{ price }}</span>
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
