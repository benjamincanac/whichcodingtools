<script setup lang="ts">
import { FEATURES, HOSTS, LAYERS, PLANS, PLATFORMS, PROVIDERS } from '#shared/enums'
import type { Requirements } from '#shared/utils/match'

const props = defineProps<{
  requirements: Requirements
  count: number
}>()

const emit = defineEmits<{
  update: [key: keyof Requirements, value: Requirements[keyof Requirements]]
  reset: []
}>()

function set<K extends keyof Requirements>(key: K, value: Requirements[K]) {
  emit('update', key, value)
}

const showHosts = computed(() => props.requirements.where.includes('extension'))

/** Slider stops, the last one is no cap at all. */
const BUDGETS = [0, 10, 20, 50, null]
const BUDGET_LABELS = ['Free to start', 'Under $10 a month', 'Under $20 a month', 'Under $50 a month', 'Any budget']
const budgetIndex = computed({
  get: () => {
    const i = BUDGETS.indexOf(props.requirements.budget)
    return i === -1 ? BUDGETS.length - 1 : i
  },
  set: (i: number) => set('budget', BUDGETS[i] ?? null)
})

/** Compact lists: labels only, descriptions go to the title attribute. */
const layers = LAYERS.map(l => ({ label: l.label, value: l.value, description: undefined, title: l.description }))
const plans = PLANS.map(p => ({ label: p.label, value: p.value, icon: p.icon, description: undefined, title: p.description }))
const platforms = PLATFORMS.map(p => ({ label: p.label, value: p.value, icon: p.icon }))

type Flag = 'local' | 'byok' | 'free' | 'oss'

const MODEL_FLAGS = [
  { value: 'local', label: 'Local models', icon: 'i-lucide-hard-drive' },
  { value: 'byok', label: 'Own key', icon: 'i-lucide-key-round' }
] as const satisfies readonly { value: Flag, label: string, icon: string }[]

const PRICE_FLAGS = [
  { value: 'free', label: 'Free tier', icon: 'i-lucide-gift' },
  { value: 'oss', label: 'Open source', icon: 'i-lucide-git-fork' }
] as const satisfies readonly { value: Flag, label: string, icon: string }[]

/** Booleans as a checkbox group. A click flips exactly one, so only that key is emitted. */
function flags<T extends Flag>(items: readonly { value: T }[]) {
  return computed<T[]>({
    get: () => items.filter(i => props.requirements[i.value]).map(i => i.value),
    set: (values) => {
      const changed = items.find(i => props.requirements[i.value] !== values.includes(i.value))
      if (changed) set(changed.value, values.includes(changed.value))
    }
  })
}

const modelFlags = flags(MODEL_FLAGS)
const priceFlags = flags(PRICE_FLAGS)

/** Indicator hidden: the row itself carries the state, so the icon takes the checkbox slot. */
const rowUi = {
  item: 'text-toned has-data-[state=checked]:text-highlighted py-1.75',
  wrapper: 'flex-row items-center gap-2 text-start',
  label: 'font-normal text-inherit truncate'
}
const gridUi = { ...rowUi, fieldset: 'grid grid-cols-2 gap-1.5' }
/** Platforms keep the default hidden-indicator layout: icon above a centered label. */
const tileUi = { ...rowUi, wrapper: undefined, fieldset: 'grid grid-cols-3 gap-1.5' }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between h-5">
      <p class="text-[11px] font-semibold uppercase text-dimmed tracking-wider">
        Filters
      </p>
      <UButton
        v-if="count"
        :label="`Reset (${count})`"
        color="neutral"
        variant="link"
        size="xs"
        class="p-0"
        @click="emit('reset')"
      />
    </div>

    <section class="flex flex-col gap-1.5">
      <UCheckboxGroup
        :items="layers"
        :model-value="requirements.where"
        color="neutral"
        variant="table"
        size="xs"
        :ui="rowUi"
        @update:model-value="set('where', $event as Requirements['where'])"
      >
        <template #label="{ item }">
          <span :title="item.title">{{ item.label }}</span>
        </template>
      </UCheckboxGroup>
      <USelectMenu
        v-if="showHosts"
        :items="[...HOSTS]"
        :model-value="requirements.hosts"
        value-key="value"
        multiple
        placeholder="Which editor?"
        icon="i-lucide-puzzle"
        size="sm"
        class="w-full"
        @update:model-value="set('hosts', $event as Requirements['hosts'])"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-xs font-medium text-highlighted">
        Platform
      </p>
      <UCheckboxGroup
        :items="platforms"
        :model-value="requirements.platforms"
        color="neutral"
        variant="card"
        indicator="hidden"
        size="xs"
        :ui="tileUi"
        @update:model-value="set('platforms', $event as Requirements['platforms'])"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-xs font-medium text-highlighted">
        I already pay for
      </p>
      <UCheckboxGroup
        :items="plans"
        :model-value="requirements.plans"
        color="neutral"
        variant="card"
        indicator="hidden"
        size="xs"
        :ui="gridUi"
        @update:model-value="set('plans', $event as Requirements['plans'])"
      >
        <template #label="{ item }">
          <span :title="item.title">{{ item.label }}</span>
        </template>
      </UCheckboxGroup>
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-xs font-medium text-highlighted">
        Models
      </p>
      <USelectMenu
        :items="[...PROVIDERS]"
        :model-value="requirements.providers"
        value-key="value"
        multiple
        placeholder="Providers it must support"
        icon="i-lucide-brain"
        size="sm"
        class="w-full"
        @update:model-value="set('providers', $event as Requirements['providers'])"
      />
      <UCheckboxGroup
        v-model="modelFlags"
        :items="[...MODEL_FLAGS]"
        color="neutral"
        variant="card"
        indicator="hidden"
        size="xs"
        :ui="gridUi"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium text-highlighted">
          Budget
        </p>
        <p class="text-xs text-muted">
          {{ BUDGET_LABELS[budgetIndex] }}
        </p>
      </div>
      <USlider
        :model-value="budgetIndex"
        :max="BUDGETS.length - 1"
        aria-label="Budget"
        :aria-valuetext="BUDGET_LABELS[budgetIndex]"
        color="neutral"
        size="sm"
        class="my-2"
        @update:model-value="budgetIndex = $event as number"
      />
      <UCheckboxGroup
        v-model="priceFlags"
        :items="[...PRICE_FLAGS]"
        color="neutral"
        variant="card"
        indicator="hidden"
        size="xs"
        :ui="gridUi"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-xs font-medium text-highlighted">
        Must have
      </p>
      <USelectMenu
        :items="[...FEATURES]"
        :model-value="requirements.features"
        value-key="value"
        multiple
        placeholder="Features"
        icon="i-lucide-list-checks"
        size="sm"
        class="w-full"
        @update:model-value="set('features', $event as Requirements['features'])"
      />
    </section>
  </div>
</template>
