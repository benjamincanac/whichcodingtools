<script setup lang="ts">
import type { ToolRecord } from '#shared/types/tool'
import { compareTools } from '#shared/utils/compare'

const props = defineProps<{
  tools: ToolRecord[]
  bySlug: Map<string, ToolRecord>
}>()

const groups = computed(() => compareTools(props.tools, props.bySlug))
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-default bg-white dark:bg-muted">
    <table class="w-full min-w-[640px] text-sm">
      <thead class="sticky top-0 z-10 bg-white dark:bg-muted">
        <tr class="border-b border-default">
          <th class="w-44 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted" />
          <th
            v-for="tool in tools"
            :key="tool.slug"
            class="px-4 py-3 text-left align-top"
          >
            <NuxtLink
              :to="`/tools/${tool.slug}`"
              class="flex items-center gap-2 font-medium text-highlighted hover:underline underline-offset-4"
            >
              <ToolAvatar
                :tool="tool"
                size="sm"
              />
              {{ tool.name }}
            </NuxtLink>
          </th>
        </tr>
      </thead>
      <tbody
        v-for="group in groups"
        :key="group.key"
      >
        <tr class="border-y border-default bg-muted/60 dark:bg-elevated/30">
          <th
            :colspan="tools.length + 1"
            class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted"
          >
            {{ group.label }}
          </th>
        </tr>
        <tr
          v-for="row in group.rows"
          :key="row.key"
          class="border-b border-default last:border-b-0"
        >
          <th
            scope="row"
            class="px-4 py-2.5 text-left font-normal text-toned align-top"
          >
            {{ row.label }}
          </th>
          <td
            v-for="(cell, index) in row.cells"
            :key="index"
            class="px-4 py-2.5 align-top"
          >
            <div class="flex items-start gap-1.5">
              <UIcon
                v-if="cell.ok !== undefined"
                :name="cell.ok ? 'i-lucide-check' : 'i-lucide-minus'"
                class="mt-0.5 size-4 shrink-0"
                :class="cell.ok ? 'text-success' : 'text-dimmed'"
              />
              <div>
                <div :class="cell.ok === false ? 'text-muted' : 'text-highlighted'">
                  {{ cell.text }}
                </div>
                <div
                  v-if="cell.detail"
                  class="text-xs text-muted"
                >
                  {{ cell.detail }}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
