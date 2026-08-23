<script setup lang="ts">
import type { ButtonProps, PageLink } from '@nuxt/ui'
import type { EnumOption } from '#shared/enums'
import { BYOK, FEATURES, HOSTS, LAYERS, LICENSE_KINDS, PLATFORMS, PROVIDERS, STATUSES, optionLabel } from '#shared/enums'
import type { ToolRecord } from '#shared/types/tool'
import { findByAlias } from '#shared/utils/tools'
import { relativeDays } from '#shared/utils/freshness'

const route = useRoute()
const { site } = useAppConfig()
const slug = computed(() => String(route.params.slug))

const { tools, bySlug } = useTools()

const { data: tool, error } = await useFetch<ToolRecord>(`/api/tools/${slug.value}.json`, {
  key: `tool-${slug.value}`
})

if (!tool.value) {
  // Renamed tools keep their old URL: the build emits a 301, this covers client-side navigation.
  const aliased = findByAlias(slug.value, tools.value)
  if (aliased) {
    await navigateTo(`/tools/${aliased.slug}`, { redirectCode: 301, replace: true })
  } else {
    throw createError({ statusCode: 404, statusMessage: `No tool called "${slug.value}"`, fatal: true, cause: error.value })
  }
}

const t = computed(() => tool.value!)

const layerLabel = computed(() => optionLabel(LAYERS, t.value.layer))
const platforms = computed(() => PLATFORMS.filter(p => t.value.platforms.includes(p.value)))
const hosts = computed(() => HOSTS.filter(h => t.value.hosts.includes(h.value)))
const features = computed(() => FEATURES.filter(f => t.value.features.includes(f.value)))
const providers = computed<EnumOption[]>(() => PROVIDERS.filter(p => t.value.effective_providers.includes(p.value)))
const inheritsProviders = computed(() => !t.value.models.providers?.length && t.value.effective_providers.length > 0)
const successor = computed(() => t.value.successor ? bySlug.value.get(t.value.successor) : undefined)

const priceLabel = computed(() => {
  if (t.value.entry_price === null) return t.value.pricing_model === 'usage' ? 'Usage-based' : 'Contact sales'
  if (t.value.entry_price === 0) return t.value.pricing_model === 'free' ? 'Free' : 'Free tier'
  return `From $${t.value.entry_price}/mo`
})

const headerLinks = computed(() => [
  { label: 'Website', to: t.value.homepage, target: '_blank', icon: 'i-lucide-globe', color: 'neutral' as const },
  t.value.links.pricing && { label: 'Pricing', to: t.value.links.pricing, target: '_blank', icon: 'i-lucide-tag', color: 'neutral' as const, variant: 'outline' as const },
  t.value.links.repo && { label: 'Repo', to: t.value.links.repo, target: '_blank', icon: 'i-lucide-github', color: 'neutral' as const, variant: 'outline' as const },
  t.value.links.docs && { label: 'Docs', to: t.value.links.docs, target: '_blank', icon: 'i-lucide-book-open', color: 'neutral' as const, variant: 'outline' as const }
].filter(Boolean) as ButtonProps[])

const yamlUrl = computed(() => `https://github.com/${site.repo}/blob/${site.branch}/content/tools/${t.value.slug}.yml`)
const issueUrl = computed(() => {
  const params = new URLSearchParams({ template: 'outdated.yml', title: `[${t.value.name}] Outdated data`, tool: t.value.slug })
  return `https://github.com/${site.repo}/issues/new?${params}`
})

const asideLinks = computed<PageLink[]>(() => [
  { label: 'Edit this tool on GitHub', to: yamlUrl.value, target: '_blank', icon: 'i-lucide-pencil' },
  { label: 'Report outdated data', to: issueUrl.value, target: '_blank', icon: 'i-lucide-flag' },
  { label: 'JSON', to: `/api/tools/${t.value.slug}.json`, target: '_blank', icon: 'i-lucide-braces' },
  ...(t.value.links.changelog ? [{ label: 'Changelog', to: t.value.links.changelog, target: '_blank', icon: 'i-lucide-scroll-text' }] : [])
])

const facts = computed(() => [
  { label: 'Layer', value: [layerLabel.value, ...t.value.secondary_layers.map(l => optionLabel(LAYERS, l))].join(', ') },
  { label: 'Vendor', value: t.value.vendor },
  { label: 'Platforms', value: platforms.value.map(p => p.label).join(', ') },
  ...(hosts.value.length ? [{ label: 'Editors', value: hosts.value.map(h => h.label).join(', ') }] : []),
  { label: 'License', value: t.value.license.spdx === 'proprietary' ? 'Proprietary' : t.value.license.spdx },
  { label: 'Pricing', value: priceLabel.value },
  { label: 'Status', value: optionLabel(STATUSES, t.value.status) }
])

useSeoMeta({
  title: `${t.value.name} pricing, platforms and integrations`,
  description: t.value.description
})

defineOgImageComponent('ToolSatori', {
  headline: layerLabel.value,
  title: t.value.name,
  description: t.value.description,
  meta: priceLabel.value
})

useSchemaOrg([
  defineSoftwareApp({
    name: t.value.name,
    description: t.value.description,
    url: t.value.homepage,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: platforms.value.map(p => p.label).join(', '),
    offers: t.value.entry_price !== null
      ? { price: t.value.entry_price, priceCurrency: 'USD' }
      : undefined
  })
])
</script>

<template>
  <UContainer v-if="tool">
    <UPage :ui="{ root: 'lg:grid-cols-12 gap-8', center: 'lg:col-span-9', right: 'lg:col-span-3' }">
      <div class="flex flex-col gap-10 py-8 lg:py-12">
        <header class="flex flex-col gap-6">
          <UButton
            to="/"
            label="Finder"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="link"
            size="sm"
            class="self-start -ms-2.5"
          />

          <div class="flex flex-col sm:flex-row sm:items-start gap-5">
            <ToolAvatar
              :tool="t"
              size="3xl"
            />
            <div class="flex flex-col gap-3 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-3xl sm:text-4xl font-medium tracking-tight text-highlighted">
                  {{ t.name }}
                </h1>
                <UBadge
                  color="neutral"
                  variant="outline"
                  class="rounded-full"
                >
                  {{ layerLabel }}
                </UBadge>
                <UBadge
                  v-for="layer in t.secondary_layers"
                  :key="layer"
                  color="neutral"
                  variant="soft"
                  class="rounded-full"
                >
                  {{ optionLabel(LAYERS, layer) }}
                </UBadge>
                <UBadge
                  v-if="t.status !== 'active'"
                  :color="t.status === 'sunset' ? 'error' : 'warning'"
                  variant="subtle"
                  class="rounded-full"
                >
                  {{ optionLabel(STATUSES, t.status) }}
                </UBadge>
              </div>
              <p class="text-base sm:text-lg text-toned max-w-2xl">
                {{ t.description }}
              </p>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                <span>{{ t.vendor }}</span>
                <span class="flex items-center gap-1.5">
                  <UIcon
                    v-for="platform in platforms"
                    :key="platform.value"
                    :name="platform.icon!"
                    class="size-4"
                    :title="platform.label"
                  />
                </span>
                <span class="font-mono text-highlighted">{{ priceLabel }}</span>
                <ToolFreshness
                  :freshness="t.freshness"
                  variant="dot"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="link in headerLinks"
              :key="link.label"
              v-bind="link"
              size="sm"
            />
          </div>
        </header>

        <ToolAliasBanner
          v-if="t.aliases.length"
          :name="t.name"
          :aliases="t.aliases"
        />

        <UAlert
          v-if="t.status === 'sunset'"
          color="error"
          variant="subtle"
          icon="i-lucide-archive"
          :title="`Discontinued${t.sunset_at ? ` on ${t.sunset_at}` : ''}`"
          :description="successor ? `Succeeded by ${successor.name}.` : undefined"
          :actions="successor ? [{ label: `Go to ${successor.name}`, to: `/tools/${successor.slug}`, color: 'neutral', variant: 'outline' }] : undefined"
        />

        <section class="flex flex-col gap-4">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Pricing
          </h2>
          <ToolPricing
            :tool="t"
            :by-slug="bySlug"
          />
        </section>

        <section
          v-if="t.wraps.length || t.wrapped_by.length"
          class="flex flex-col gap-4"
        >
          <div>
            <h2 class="text-xl font-medium tracking-tight text-highlighted">
              Works with
            </h2>
            <p class="text-sm text-muted">
              What {{ t.name }} runs, and what can run {{ t.name }}. "With your existing login" means the wrapped tool's subscription is reused, no second bill.
            </p>
          </div>
          <ToolWraps
            :tool="t"
            :by-slug="bySlug"
          />
        </section>

        <section class="grid gap-8 sm:grid-cols-2">
          <div class="flex flex-col gap-3">
            <h2 class="text-xl font-medium tracking-tight text-highlighted">
              Models
            </h2>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="provider in providers"
                :key="provider.value"
                color="neutral"
                variant="outline"
                class="rounded-full"
                :icon="provider.icon"
              >
                {{ provider.label }}
              </UBadge>
              <UBadge
                v-if="t.models.local"
                color="neutral"
                variant="outline"
                class="rounded-full"
                icon="i-lucide-hard-drive"
              >
                Local models
              </UBadge>
              <UBadge
                color="neutral"
                :variant="t.models.byok === 'none' ? 'soft' : 'outline'"
                class="rounded-full"
                icon="i-lucide-key-round"
              >
                {{ optionLabel(BYOK, t.models.byok) }}
              </UBadge>
            </div>
            <p
              v-if="inheritsProviders"
              class="text-xs text-muted"
            >
              Inherited from the tools it runs.
            </p>
            <p
              v-if="t.models.notes"
              class="text-sm text-toned"
            >
              {{ t.models.notes }}
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <h2 class="text-xl font-medium tracking-tight text-highlighted">
              Features
            </h2>
            <div
              v-if="features.length"
              class="flex flex-wrap gap-1.5"
            >
              <UTooltip
                v-for="feature in features"
                :key="feature.value"
                :text="feature.description"
              >
                <UBadge
                  color="neutral"
                  variant="outline"
                  class="rounded-full"
                >
                  {{ feature.label }}
                </UBadge>
              </UTooltip>
            </div>
            <p
              v-else
              class="text-sm text-muted"
            >
              No features recorded yet.
            </p>
          </div>
        </section>

        <section
          v-if="t.install.length"
          class="flex flex-col gap-4"
        >
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Install
          </h2>
          <ToolInstall :install="t.install" />
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            License
          </h2>
          <p class="text-sm text-toned">
            <span class="font-mono text-highlighted">{{ t.license.spdx === 'proprietary' ? 'Proprietary' : t.license.spdx }}</span>
            <span class="text-muted"> · {{ optionLabel(LICENSE_KINDS, t.license.kind) }}</span>
            <template v-if="t.license.repo">
              ·
              <ULink
                :to="t.license.repo"
                target="_blank"
                class="underline underline-offset-4"
              >{{ t.license.repo.replace(/^https?:\/\/(www\.)?/, '') }}</ULink>
            </template>
          </p>
          <p
            v-if="t.license.notes"
            class="text-sm text-muted"
          >
            {{ t.license.notes }}
          </p>
        </section>

        <section class="flex flex-col gap-3">
          <div>
            <h2 class="text-xl font-medium tracking-tight text-highlighted">
              Sources
            </h2>
            <p class="text-sm text-muted">
              Every fact above points at a vendor page and the date someone last checked it.
            </p>
          </div>
          <ul class="flex flex-col divide-y divide-default rounded-lg border border-default bg-white dark:bg-muted">
            <li
              v-for="source in t.sources"
              :key="source.url"
              class="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 text-sm"
            >
              <ULink
                :to="source.url"
                target="_blank"
                class="flex-1 min-w-0 truncate text-highlighted underline underline-offset-4"
              >
                {{ source.url.replace(/^https?:\/\//, '') }}
              </ULink>
              <div class="flex flex-wrap items-center gap-1.5">
                <UBadge
                  v-for="cover in source.covers"
                  :key="cover"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  class="rounded-full"
                >
                  {{ cover }}
                </UBadge>
                <span class="text-xs text-muted whitespace-nowrap">
                  <ClientOnly>
                    {{ relativeDays(source.verified_at) }}
                    <template #fallback>
                      {{ source.verified_at }}
                    </template>
                  </ClientOnly>
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <template #right>
        <UPageAside :ui="{ root: 'pt-8 lg:pt-12' }">
          <dl class="flex flex-col gap-3 text-sm">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="flex flex-col gap-0.5"
            >
              <dt class="text-xs uppercase tracking-wider text-muted">
                {{ fact.label }}
              </dt>
              <dd class="text-highlighted">
                {{ fact.value }}
              </dd>
            </div>
          </dl>
          <USeparator class="my-6" />
          <UPageLinks
            title="Maintain"
            :links="asideLinks"
          />
        </UPageAside>
      </template>
    </UPage>
  </UContainer>
</template>
