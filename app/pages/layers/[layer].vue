<script setup lang="ts">
import { LAYERS, type Layer } from '#shared/enums'
import { LAYER_INTROS, LAYER_SECONDARY_INTRO, layerPageTitle, layerSecondaryTitle } from '#shared/content/pages'

const route = useRoute()
const layer = LAYERS.find(l => l.value === route.params.layer)
if (!layer) {
  throw createError({ statusCode: 404, statusMessage: 'No such layer', fatal: true })
}

const { tools, ready } = useTools()
await ready
const primary = computed(() => tools.value.filter(t => t.layer === layer.value))
const secondary = computed(() => tools.value.filter(t => t.secondary_layers.includes(layer.value as Layer)))

useSeoMeta({
  title: layerPageTitle(layer),
  description: LAYER_INTROS[layer.value as Layer]
})

defineOgImage('ToolSatori', {
  headline: 'Layer',
  title: `${layer.label}s`,
  description: LAYER_INTROS[layer.value as Layer]
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="`${layer.label}s`"
        :description="LAYER_INTROS[layer.value as Layer]"
        :links="[
          { label: 'Compare all', to: `/compare?tools=${primary.slice(0, 4).map(t => t.slug).join(',')}`, icon: 'i-lucide-columns-3', color: 'neutral', variant: 'outline' },
          { label: 'Open in the finder', to: `/tools?where=${layer.value}`, icon: 'i-lucide-sliders-horizontal', color: 'neutral', variant: 'solid' }
        ]"
      />
      <UPageBody>
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
              {{ layerSecondaryTitle(layer) }}
              <span class="text-muted font-normal">({{ secondary.length }})</span>
            </h2>
            <p class="text-sm text-muted">
              {{ LAYER_SECONDARY_INTRO }}
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
      </UPageBody>
    </UPage>
  </UContainer>
</template>
