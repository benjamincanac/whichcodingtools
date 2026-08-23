<script setup lang="ts">
import { LAYERS, type Layer } from '#shared/enums'
import { LAYER_INTROS } from '#shared/content/pages'

const route = useRoute()
const layer = LAYERS.find(l => l.value === route.params.layer)
if (!layer) {
  throw createError({ statusCode: 404, statusMessage: 'No such layer', fatal: true })
}

const { tools } = useTools()
const primary = computed(() => tools.value.filter(t => t.layer === layer.value))
const secondary = computed(() => tools.value.filter(t => t.secondary_layers.includes(layer.value as Layer)))

useSeoMeta({
  title: `${layer.label}s compared`,
  description: LAYER_INTROS[layer.value as Layer]
})

defineOgImageComponent('ToolSatori', {
  headline: 'Layer',
  title: `${layer.label}s`,
  description: LAYER_INTROS[layer.value as Layer]
})
</script>

<template>
  <UContainer>
    <UPageHeader
      :title="`${layer.label}s`"
      :description="LAYER_INTROS[layer.value as Layer]"
      :ui="{ root: 'py-8 lg:py-12', description: 'max-w-3xl' }"
      :links="[
        { label: 'Compare all', to: `/compare?tools=${primary.slice(0, 4).map(t => t.slug).join(',')}`, icon: 'i-lucide-columns-3', color: 'neutral', variant: 'outline' },
        { label: 'Open in the finder', to: `/?where=${layer.value}`, icon: 'i-lucide-sliders-horizontal', color: 'neutral', variant: 'ghost' }
      ]"
    />
    <div class="flex flex-col gap-10 pb-16">
      <UPageGrid class="gap-4">
        <ToolCard
          v-for="tool in primary"
          :key="tool.slug"
          :tool="tool"
        />
      </UPageGrid>
      <section
        v-if="secondary.length"
        class="flex flex-col gap-4"
      >
        <div>
          <h2 class="text-base font-medium tracking-tight text-highlighted">
            Also available as a {{ layer.label.toLowerCase() }}
            <span class="text-muted font-normal">({{ secondary.length }})</span>
          </h2>
          <p class="text-sm text-muted">
            Products whose primary form is something else but ship one of these too.
          </p>
        </div>
        <UPageGrid class="gap-4">
          <ToolCard
            v-for="tool in secondary"
            :key="tool.slug"
            :tool="tool"
          />
        </UPageGrid>
      </section>
    </div>
  </UContainer>
</template>
