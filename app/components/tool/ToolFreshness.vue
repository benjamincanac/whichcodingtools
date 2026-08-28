<script setup lang="ts">
import type { Freshness } from '#shared/types/tool'
import { relativeDays } from '#shared/utils/freshness'

const props = withDefaults(defineProps<{
  // What a badge renders, which is what a list payload carries. `computed_at` is the clock that
  // set `level`, so the label counts from the same moment and the two cannot disagree.
  freshness: Pick<Freshness, 'verified_at' | 'level' | 'computed_at'>
  variant?: 'dot' | 'badge'
}>(), { variant: 'badge' })

const relative = computed(() => relativeDays(props.freshness.verified_at, new Date(props.freshness.computed_at)))
const label = computed(() => `Pricing verified ${relative.value}`)
const dotClass = computed(() => ({
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error'
}[props.freshness.level]))
</script>

<template>
  <UTooltip :text="`${label} (${freshness.verified_at})`">
    <span
      v-if="variant === 'dot'"
      class="inline-flex items-center gap-1.5 text-xs text-muted whitespace-nowrap"
    >
      <span
        class="size-1.5 rounded-full"
        :class="dotClass"
      />
      {{ relative }}
    </span>
    <UBadge
      v-else
      :color="freshness.level"
      variant="subtle"
      size="sm"
      class="rounded-full"
    >
      <span
        class="size-1.5 rounded-full"
        :class="dotClass"
      />
      {{ label }}
    </UBadge>
  </UTooltip>
</template>
