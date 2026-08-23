<script setup lang="ts">
import type { Freshness } from '#shared/types/tool'
import { relativeDays } from '#shared/utils/freshness'

const props = withDefaults(defineProps<{
  freshness: Freshness
  variant?: 'dot' | 'badge'
}>(), { variant: 'badge' })

const label = computed(() => `Pricing verified ${relativeDays(props.freshness.verified_at)}`)
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
      <ClientOnly>
        {{ relativeDays(freshness.verified_at) }}
        <template #fallback>
          {{ freshness.verified_at }}
        </template>
      </ClientOnly>
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
      <ClientOnly>
        {{ label }}
        <template #fallback>
          Pricing verified {{ freshness.verified_at }}
        </template>
      </ClientOnly>
    </UBadge>
  </UTooltip>
</template>
