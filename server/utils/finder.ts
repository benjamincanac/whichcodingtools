import { z } from 'zod'
import { FEATURE_VALUES, HOST_VALUES, LAYER_VALUES, PLAN_VALUES, PLATFORM_VALUES, PROVIDER_VALUES } from '#shared/enums'
import type { ParsedRequirements } from '#shared/finder'

/**
 * The shape the model fills, and the source `/openapi.json` describes the finder with.
 *
 * Server side on purpose. The landing page imports `toRequirements` from `shared/finder.ts`,
 * so anything at that module's scope ships to the browser, and this schema alone pulled zod
 * into the client bundle.
 */
export const ParsedRequirementsSchema = z.object({
  where: z.array(z.enum(LAYER_VALUES)).describe('Form factors the person asked for. Empty when they did not say.'),
  hosts: z.array(z.enum(HOST_VALUES)).describe('Editors they want the tool to run inside, only when they named one.'),
  platforms: z.array(z.enum(PLATFORM_VALUES)).describe('Operating systems or devices they must have.'),
  plans: z.array(z.enum(PLAN_VALUES)).describe('Subscriptions they already pay for and want to reuse.'),
  providers: z.array(z.enum(PROVIDER_VALUES)).describe('Model vendors or gateways they require. "Claude models" means anthropic, "GPT" means openai, "Gemini" means google, "Grok" means xai, "AI Gateway" means vercel-ai-gateway.'),
  features: z.array(z.enum(FEATURE_VALUES)).describe('Capabilities they explicitly asked for.'),
  local: z.boolean().describe('They want to run local or self-hosted models (Ollama, LM Studio).'),
  byok: z.boolean().describe('They want to bring their own API key.'),
  free: z.boolean().describe('They want a free tier or said free.'),
  oss: z.boolean().describe('They want open source only.'),
  budget: z.number().nullable().describe('Maximum USD per month they mentioned, otherwise null. "cheap" or "under twenty" is 20, "nothing" or "free only" is 0.'),
  q: z.string().describe('Leftover words that name a specific tool or vendor to search for, otherwise an empty string.'),
  summary: z.string().max(160).describe('One short sentence restating what was understood, in the second person, no em dashes.')
})

/** The two halves cannot drift: the client only ever sees the interface. */
type SameShape<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false
export const parsedRequirementsInSync: SameShape<z.infer<typeof ParsedRequirementsSchema>, ParsedRequirements> = true
