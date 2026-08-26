<script setup lang="ts">
import { LAYERS } from '#shared/enums'
import type { ToolRecord } from '#shared/types/tool'

const props = defineProps<{
  tools: ToolRecord[]
  max: number
}>()

const selected = defineModel<string[]>({ required: true })

const open = ref(false)

const bySlug = computed(() => new Map(props.tools.map(t => [t.slug, t])))
const picked = computed(() => selected.value.map(s => bySlug.value.get(s)).filter(t => !!t))
const full = computed(() => selected.value.length >= props.max)

/** One group per layer. Past the cap the rest goes disabled, so the palette carries the limit. */
const groups = computed(() => LAYERS.map(layer => ({
  id: layer.value,
  label: layer.label,
  items: props.tools.filter(t => t.layer === layer.value).map(t => ({
    label: t.name,
    suffix: t.vendor,
    value: t.slug,
    disabled: full.value && !selected.value.includes(t.slug)
  }))
})).filter(group => group.items.length))

function remove(slug: string) {
  selected.value = selected.value.filter(s => s !== slug)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      v-for="tool in picked"
      :key="tool.slug"
      :label="tool.name"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-x"
      :aria-label="`Remove ${tool.name}`"
      @click="remove(tool.slug)"
    >
      <template #leading>
        <ToolAvatar
          :tool="tool"
          size="3xs"
        />
      </template>
    </UButton>

    <UModal
      v-model:open="open"
      :ui="{ content: 'max-w-2xl' }"
    >
      <UButton
        :label="picked.length ? 'Add a tool' : 'Pick tools'"
        icon="i-lucide-plus"
        color="neutral"
      />

      <template #content>
        <UCommandPalette
          v-model="selected"
          multiple
          :groups="groups"
          value-key="value"
          placeholder="Search by name or vendor"
          close
          class="h-96"
          @update:open="open = $event"
        >
          <template #item-leading="{ item }">
            <ToolAvatar
              :tool="bySlug.get(item.value)!"
              size="2xs"
            />
          </template>

          <template #footer>
            <div class="flex items-center justify-between gap-2 px-2">
              <span class="text-xs text-dimmed">{{ selected.length }} of {{ max }}{{ full ? ', remove one to add another' : '' }}</span>
              <UButton
                label="Done"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="open = false"
              />
            </div>
          </template>
        </UCommandPalette>
      </template>
    </UModal>
  </div>
</template>
