<script setup lang="ts">
import { PLANS, type Plan } from '#shared/enums'
import { PLAN_GROUPS, PLAN_INTROS, planPageTitle } from '#shared/content/pages'
import { planAccess, matchTool, EMPTY_REQUIREMENTS } from '#shared/utils/match'

const route = useRoute()
const plan = PLANS.find(p => p.value === route.params.plan)
if (!plan) {
  throw createError({ statusCode: 404, statusMessage: 'No such plan', fatal: true })
}

const { tools, bySlug, ready } = useTools()
await ready

const groups = computed(() => {
  const req = { ...EMPTY_REQUIREMENTS, plans: [plan.value as Plan] }
  const entries = tools.value
    .map(tool => ({ tool, access: planAccess(tool, plan.value as Plan, bySlug.value), match: matchTool(tool, req, bySlug.value) }))
    .filter(e => e.access)
  const pick = {
    included: () => entries.filter(e => e.access!.included),
    signin: () => entries.filter(e => !e.access!.included && !e.access!.via),
    wraps: () => entries.filter(e => Boolean(e.access!.via))
  }
  return PLAN_GROUPS.map(group => ({ ...group, items: pick[group.key]() })).filter(g => g.items.length)
})

useSeoMeta({
  title: planPageTitle(plan),
  description: PLAN_INTROS[plan.value as Plan]
})

defineOgImage('ToolSatori', {
  headline: 'I already pay for',
  title: `What you can use with ${plan.label}`,
  description: PLAN_INTROS[plan.value as Plan]
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="planPageTitle(plan)"
        :description="PLAN_INTROS[plan.value as Plan]"
        :links="[{ label: 'Open in the finder', to: `/tools?plans=${plan.value}`, icon: 'i-lucide-sliders-horizontal', color: 'neutral', variant: 'solid' }]"
      />

      <UPageBody>
        <section
          v-for="group in groups"
          :key="group.key"
          class="flex flex-col gap-4"
        >
          <div>
            <h2 class="text-base font-medium tracking-tight text-highlighted">
              {{ group.title }}
              <span class="text-muted font-normal">({{ group.items.length }})</span>
            </h2>
            <p class="text-sm text-muted">
              {{ group.description }}
            </p>
          </div>

          <UPageGrid class="gap-4">
            <ToolCard
              v-for="{ tool, match } in group.items"
              :key="tool.slug"
              :tool="tool"
              :match="match"
            />
          </UPageGrid>
        </section>

        <UEmpty
          v-if="!groups.length"
          icon="i-lucide-wallet"
          title="Nothing in the directory uses this plan yet"
          :description="`No tool lists ${plan.label} as a plan it is part of or signs in with.`"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
