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

/** Compact lists: labels only, descriptions go to the title attribute. */
const layers = LAYERS.map(l => ({ label: l.label, value: l.value, description: undefined, title: l.description }))
const platforms = PLATFORMS.map(p => ({ label: p.label, value: p.value }))
const groupUi = { fieldset: 'gap-0', item: 'py-0.5', label: 'font-normal text-sm' }
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between h-5">
      <p class="text-xs font-medium uppercase tracking-wider text-muted">
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
      <p class="text-sm font-medium text-highlighted">
        Where you work
      </p>
      <UCheckboxGroup
        :items="layers"
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
        class="w-full mt-1"
        @update:model-value="set('hosts', $event as Requirements['hosts'])"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-sm font-medium text-highlighted">
        Platform
      </p>
      <UCheckboxGroup
        :items="platforms"
        :model-value="requirements.platforms"
        size="sm"
        :ui="{ ...groupUi, fieldset: 'grid grid-cols-2 gap-x-2' }"
        @update:model-value="set('platforms', $event as Requirements['platforms'])"
      />
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-sm font-medium text-highlighted">
        I already pay for
      </p>
      <USelectMenu
        :items="[...PLANS]"
        :model-value="requirements.plans"
        value-key="value"
        multiple
        placeholder="Claude, ChatGPT, Copilot..."
        icon="i-lucide-wallet"
        :search-input="false"
        size="sm"
        class="w-full"
        @update:model-value="set('plans', $event as Requirements['plans'])"
      />
    </section>

    <section class="flex flex-col gap-1.5">
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
      <div class="grid grid-cols-2 gap-2 pt-1">
        <USwitch
          label="Local models"
          size="xs"
          :model-value="requirements.local"
          @update:model-value="set('local', $event)"
        />
        <USwitch
          label="Own key"
          size="xs"
          :model-value="requirements.byok"
          @update:model-value="set('byok', $event)"
        />
      </div>
    </section>

    <section class="flex flex-col gap-1.5">
      <p class="text-sm font-medium text-highlighted">
        Budget
      </p>
      <USelectMenu
        v-model="budget"
        :items="budgets"
        value-key="value"
        :search-input="false"
        icon="i-lucide-piggy-bank"
        size="sm"
        class="w-full"
      />
      <div class="grid grid-cols-2 gap-2 pt-1">
        <USwitch
          label="Free tier"
          size="xs"
          :model-value="requirements.free"
          @update:model-value="set('free', $event)"
        />
        <USwitch
          label="Open source"
          size="xs"
          :model-value="requirements.oss"
          @update:model-value="set('oss', $event)"
        />
      </div>
    </section>

    <section class="flex flex-col gap-1.5">
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
    </section>
  </div>
</template>
