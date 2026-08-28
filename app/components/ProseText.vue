<script setup lang="ts">
/**
 * The shared `/developers` copy as HTML.
 *
 * That copy is written once and rendered twice, as markdown for agents and here for people, so
 * it carries markdown's backticks. Rather than strip them, render them as what they mean.
 * Paragraphs split on a blank line, the same as markdown.
 */
const props = defineProps<{ text: string }>()

const paragraphs = computed(() => props.text.split('\n\n').map(paragraph =>
  // An odd number of backticks would swallow the rest of the paragraph, so the split is on
  // pairs: every odd index is code, and a stray backtick simply stays text.
  paragraph.split('`').map((part, index) => ({ text: part, code: index % 2 === 1 }))
))
</script>

<template>
  <p
    v-for="(parts, index) in paragraphs"
    :key="index"
    class="text-sm text-toned text-pretty"
  >
    <template
      v-for="(part, i) in parts"
      :key="i"
    >
      <code
        v-if="part.code"
        class="font-mono text-xs text-highlighted"
      >{{ part.text }}</code>
      <template v-else>
        {{ part.text }}
      </template>
    </template>
  </p>
</template>
