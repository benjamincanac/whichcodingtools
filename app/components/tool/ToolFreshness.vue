<script setup lang="ts">
import type { Freshness } from '#shared/types/tool'
import { relativeDays } from '#shared/utils/freshness'

const props = withDefaults(defineProps<{
  // The two fields a badge renders, which is what a list payload carries.
  freshness: Pick<Freshness, 'verified_at' | 'level'>
  variant?: 'dot' | 'badge'
}>(), { variant: 'badge' })

const now = useNow()
const relative = computed(() => relativeDays(props.freshness.verified_at, now.value))
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
