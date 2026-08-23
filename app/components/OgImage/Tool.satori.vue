<script setup lang="ts">
/**
 * OG image for the finder and every tool page. Pure black, a faint dot grid,
 * a mono eyebrow, the title and a short description. Satori supports a CSS
 * subset, so everything is inline styles and no nested components.
 */
defineOptions({ inheritAttrs: false })

const { title = '', description = '', headline = '', meta = '' } = defineProps<{
  title?: string
  description?: string
  headline?: string
  meta?: string
}>()

const site = useSiteConfig()
const host = site.url ? site.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''

function truncate(str: string, max: number) {
  if (!str || str.length <= max) return str
  const cut = str.lastIndexOf(' ', max)
  return `${str.slice(0, cut > 0 ? cut : max)}…`
}
</script>

<template>
  <div
    class="flex flex-col flex-1 min-h-full min-w-full"
    style="background: #000; position: relative; overflow: hidden"
  >
    <div
      style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(250, 250, 250, 0.06) 1px, transparent 1px); background-size: 28px 28px;"
    />

    <div
      style="position: absolute; top: 72px; left: 80px; display: flex; align-items: center; gap: 12px;"
    >
      <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: #fafafa; color: #000; font-family: 'Geist Mono'; font-size: 16px; font-weight: 500;">
        &gt;_
      </div>
      <div style="font-family: 'Geist'; font-size: 22px; font-weight: 500; color: #fafafa; letter-spacing: -0.02em;">
        {{ site.name }}
      </div>
    </div>

    <div
      class="flex flex-col flex-1 justify-center min-h-0"
      style="position: relative; z-index: 1; padding: 60px 80px 0"
    >
      <div
        v-if="headline"
        style="font-family: 'Geist Mono'; font-size: 16px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 24px;"
      >
        {{ headline }}
      </div>

      <div
        style="font-family: 'Geist'; font-size: 68px; font-weight: 500; color: #fafafa; line-height: 1.05; letter-spacing: -0.035em; max-width: 1000px;"
      >
        {{ truncate(title, 70) }}
      </div>

      <div
        v-if="description"
        style="font-family: 'Geist'; font-size: 26px; color: #a1a1aa; line-height: 1.5; margin-top: 24px; max-width: 820px;"
      >
        {{ truncate(description, 140) }}
      </div>
    </div>

    <div
      style="position: absolute; z-index: 1; bottom: 48px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: center;"
    >
      <div style="font-family: 'Geist Mono'; font-size: 16px; font-weight: 500; letter-spacing: 0.12em; color: #a1a1aa;">
        {{ host }}
      </div>
      <div
        v-if="meta"
        style="font-family: 'Geist Mono'; font-size: 16px; font-weight: 500; letter-spacing: 0.12em; color: #a1a1aa;"
      >
        {{ meta }}
      </div>
    </div>
  </div>
</template>
