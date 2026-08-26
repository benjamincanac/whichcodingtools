<script setup lang="ts">
import { WRAP_VIA, optionLabel } from '#shared/enums'
import type { ToolRecord } from '#shared/types/tool'
import { costDelta } from '#shared/utils/pricing'

const props = defineProps<{
  tool: ToolRecord
  bySlug: Map<string, ToolRecord>
}>()

const runs = computed(() => props.tool.wraps
  .map(wrap => ({ wrap, target: props.bySlug.get(wrap.tool), delta: costDelta(props.tool, wrap.tool, props.bySlug) }))
  .filter(item => item.target))

const runsInside = computed(() => props.tool.wrapped_by
  .map(slug => props.bySlug.get(slug))
  .filter((t): t is ToolRecord => Boolean(t))
  .map(host => ({ host, wrap: host.wraps.find(w => w.tool === props.tool.slug)!, delta: costDelta(host, props.tool.slug, props.bySlug) })))

function deltaText(delta: ReturnType<typeof costDelta>) {
  if (!delta) return ''
  if (delta.api_usage) return 'Bills model usage separately'
  if (delta.price === 0) return 'Free with your existing login'
  if (delta.price === 'usage') return 'Usage-based'
  if (delta.price === 'contact') return 'Contact sales'
  return `$${delta.price}/mo${delta.tier ? ` on ${delta.tier}` : ''}, with your existing login`
}
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2">
    <div
      v-if="runs.length"
      class="flex flex-col gap-3"
    >
      <h3 class="text-sm font-medium text-highlighted">
        Runs
      </h3>
      <ul class="flex flex-col gap-2">
        <li
          v-for="{ wrap, target, delta } in runs"
          :key="wrap.tool"
        >
          <NuxtLink
            :to="`/tools/${target!.slug}`"
            class="flex items-start gap-3 rounded-lg border border-default bg-elevated/50 p-3 hover:border-accented transition-colors"
          >
            <ToolAvatar
              :tool="target!"
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-medium text-highlighted">{{ target!.name }}</span>
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-full"
                >
                  via {{ optionLabel(WRAP_VIA, wrap.via) }}
                </UBadge>
              </div>
              <p class="text-xs text-muted mt-0.5">
                {{ deltaText(delta) }}
              </p>
              <p
                v-if="wrap.notes"
                class="text-xs text-toned mt-1"
              >
                {{ wrap.notes }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div
      v-if="runsInside.length"
      class="flex flex-col gap-3"
    >
      <h3 class="text-sm font-medium text-highlighted">
        Runs inside
      </h3>
      <ul class="flex flex-col gap-2">
        <li
          v-for="{ host, wrap, delta } in runsInside"
          :key="host.slug"
        >
          <NuxtLink
            :to="`/tools/${host.slug}`"
            class="flex items-start gap-3 rounded-lg border border-default bg-elevated/50 p-3 hover:border-accented transition-colors"
          >
            <ToolAvatar
              :tool="host"
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-medium text-highlighted">{{ host.name }}</span>
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-full"
                >
                  via {{ optionLabel(WRAP_VIA, wrap.via) }}
                </UBadge>
              </div>
              <p class="text-xs text-muted mt-0.5">
                {{ deltaText(delta) }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>
