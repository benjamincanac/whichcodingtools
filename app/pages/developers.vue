<script setup lang="ts">
import { API_BASE } from '#shared/api'
import { DATA, DEVELOPERS_INDEX, DISCOVERY, ENDPOINTS, INTRO, MARKDOWN, VERSIONING } from '#shared/content/developers'

useSeoMeta({
  title: DEVELOPERS_INDEX.title,
  description: DEVELOPERS_INDEX.description
})

defineOgImage('ToolSatori', {
  headline: 'Developers',
  title: 'A versioned JSON API and a markdown twin of every page',
  description: DEVELOPERS_INDEX.description
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="DEVELOPERS_INDEX.title"
        :description="DEVELOPERS_INDEX.description"
        :links="[
          { label: 'OpenAPI', to: '/openapi.json', target: '_blank', icon: 'i-lucide-file-json-2', color: 'neutral', variant: 'outline' },
          { label: `Try ${API_BASE}/tools.json`, to: `${API_BASE}/tools.json`, target: '_blank', icon: 'i-lucide-play', color: 'neutral', variant: 'solid' }
        ]"
      />

      <UPageBody>
        <div class="flex flex-col gap-3">
          <ProseText :text="INTRO" />
        </div>

        <section class="flex flex-col gap-4">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Endpoints
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-default text-left text-muted">
                  <th class="py-2 pe-4 font-normal">
                    Method
                  </th>
                  <th class="py-2 pe-4 font-normal">
                    Endpoint
                  </th>
                  <th class="py-2 font-normal">
                    Returns
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="endpoint in ENDPOINTS"
                  :key="endpoint.path"
                  class="border-b border-default/60 align-top"
                >
                  <td class="py-2 pe-4">
                    <UBadge
                      :label="endpoint.method"
                      color="neutral"
                      variant="subtle"
                      size="sm"
                    />
                  </td>
                  <td class="py-2 pe-4 whitespace-nowrap">
                    <ULink
                      v-if="endpoint.method === 'GET'"
                      :to="endpoint.path"
                      target="_blank"
                      class="font-mono text-xs"
                    >
                      {{ endpoint.path }}
                    </ULink>
                    <span
                      v-else
                      class="font-mono text-xs text-toned"
                    >{{ endpoint.path }}</span>
                  </td>
                  <td class="py-2 text-toned text-pretty">
                    {{ endpoint.summary }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-muted">
            Full request and response shapes, including the <code class="font-mono text-xs">Tool</code> schema, are in
            <ULink
              to="/openapi.json"
              target="_blank"
            >openapi.json</ULink>.
          </p>
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Versioning and deprecation
          </h2>
          <ProseText :text="VERSIONING" />
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Markdown for agents
          </h2>
          <ProseText :text="MARKDOWN" />
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            Machine-readable index
          </h2>
          <ul class="flex flex-col gap-1.5 text-sm">
            <li
              v-for="item in DISCOVERY"
              :key="item.href"
            >
              <ULink
                :to="item.href"
                target="_blank"
                class="font-mono text-xs"
              >{{ item.label }}</ULink>
              <span class="text-toned"> {{ item.summary }}</span>
            </li>
          </ul>
        </section>

        <section class="flex flex-col gap-3">
          <h2 class="text-xl font-medium tracking-tight text-highlighted">
            The data
          </h2>
          <ProseText :text="DATA" />
        </section>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
