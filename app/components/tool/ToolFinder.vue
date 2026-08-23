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

const budgets = [
  { label: 'Any budget', value: 'any' },
  { label: 'Free to start', value: '0' },
  { label: 'Under $10 a month', value: '10' },
  { label: 'Under $20 a month', value: '20' },
  { label: 'Under $50 a month', value: '50' }
]
const budget = computed({
  get: () => props.requirements.budget === null ? 'any' : String(props.requirements.budget),
  set: (v: string) => set('budget', v === 'any' ? null : Number(v))
})

const groupUi = { fieldset: 'gap-1', item: 'py-0.5', label: 'font-normal text-sm', description: 'text-xs' }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-highlighted">
        What you need
      </p>
      <UButton
        v-if="count"
        label="Reset"
        color="neutral"
        variant="link"
        size="xs"
        trailing-icon="i-lucide-x"
        @click="emit('reset')"
      />
    </div>

    <UCheckboxGroup
      legend="Where you work"
      :items="[...LAYERS]"
      :model-value="requirements.where"
      size="sm"
      :ui="groupUi"
      @update:model-value="set('where', $event as Requirements['where'])"
    />

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

    <UCheckboxGroup
      legend="Platform"
      :items="[...PLATFORMS]"
      :model-value="requirements.platforms"
      size="sm"
      orientation="horizontal"
      :ui="{ ...groupUi, fieldset: 'flex-wrap gap-x-4 gap-y-1' }"
      @update:model-value="set('platforms', $event as Requirements['platforms'])"
    />

    <UCheckboxGroup
      legend="I already pay for"
      :items="[...PLANS]"
      :model-value="requirements.plans"
      size="sm"
      :ui="groupUi"
      @update:model-value="set('plans', $event as Requirements['plans'])"
    />

    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-highlighted">
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
      <USwitch
        label="Local models"
        size="sm"
        :model-value="requirements.local"
        @update:model-value="set('local', $event)"
      />
      <USwitch
        label="Bring my own key"
        size="sm"
        :model-value="requirements.byok"
        @update:model-value="set('byok', $event)"
      />
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-highlighted">
        Budget
      </p>
      <USelectMenu
        v-model="budget"
        :items="budgets"
        value-key="value"
        :search-input="false"
        icon="i-lucide-wallet"
        size="sm"
        class="w-full"
      />
      <USwitch
        label="Has a free tier"
        size="sm"
        :model-value="requirements.free"
        @update:model-value="set('free', $event)"
      />
      <USwitch
        label="Open source only"
        size="sm"
        :model-value="requirements.oss"
        @update:model-value="set('oss', $event)"
      />
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-highlighted">
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
    </div>
  </div>
</template>
