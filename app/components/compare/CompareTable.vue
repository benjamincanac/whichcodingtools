<script setup lang="ts">
import type { ToolSummary } from '#shared/types/tool'
import { compareTools } from '#shared/utils/compare'

const props = defineProps<{
  tools: ToolSummary[]
  bySlug: Map<string, ToolSummary>
}>()

const groups = computed(() => compareTools(props.tools, props.bySlug))
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-default relative">
    <table class="w-full min-w-160 text-sm">
      <thead class="sticky top-0 z-10">
        <tr class="border-b border-default">
          <th class="w-44 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted" />
          <th
            v-for="tool in tools"
            :key="tool.slug"
            class="px-4 py-3 text-left align-top"
          >
            <ULink
              :to="`/tools/${tool.slug}`"
              class="flex items-center gap-2 font-medium text-highlighted hover:underline underline-offset-4"
            >
              <ToolAvatar
                :tool="tool"
                size="sm"
              />
              {{ tool.name }}
            </ULink>
          </th>
        </tr>
      </thead>
      <tbody
        v-for="group in groups"
        :key="group.key"
      >
        <tr class="border-y border-default bg-elevated/50">
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
            class="px-4 py-2.5 align-top whitespace-pre-wrap max-w-60"
          >
            <div class="flex items-start gap-1.5">
              <UIcon
                v-if="cell.ok !== undefined"
                :name="cell.ok ? 'i-lucide-check' : 'i-lucide-minus'"
                class="mt-0.5 size-4 shrink-0"
                :class="cell.ok ? 'text-success' : 'text-dimmed'"
              />
              <div class="min-w-0">
                <ULink
                  v-if="cell.href"
                  :to="cell.href"
                  target="_blank"
                  class="break-all text-highlighted underline underline-offset-4"
                >
                  {{ cell.text }}
                </ULink>
                <div
                  v-else
                  :class="cell.ok === false ? 'text-muted' : 'text-highlighted'"
                >
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
