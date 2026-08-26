<script setup lang="ts">
import { PLANS, type Plan } from '#shared/enums'
import { PLAN_INTROS } from '#shared/content/pages'
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
  return [
    { key: 'included', title: 'Part of the plan', description: 'No extra bill, it is what you are paying for.', items: entries.filter(e => e.access!.included) },
    { key: 'signin', title: 'Signs in with it', description: 'Separate products that accept this account for model access.', items: entries.filter(e => !e.access!.included && !e.access!.via) },
    { key: 'wraps', title: 'Runs a tool on this plan', description: 'Hosts and orchestrators that reuse the login of a tool included in the plan. The chip is what they cost on top.', items: entries.filter(e => Boolean(e.access!.via)) }
  ].filter(g => g.items.length)
})

useSeoMeta({
  title: `What you can use with a ${plan.label} subscription`,
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
        :title="`What you can use with a ${plan.label} subscription`"
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
