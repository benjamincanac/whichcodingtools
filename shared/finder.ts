import { z } from 'zod'
import { FEATURE_VALUES, HOST_VALUES, LAYER_VALUES, PLAN_VALUES, PLATFORM_VALUES, PROVIDER_VALUES } from './enums'
import type { Requirements } from './utils/match'

/**
 * What the natural-language box turns a sentence into. The model fills this, the
 * deterministic matcher does the ranking, so the model never decides which tool wins.
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

export type ParsedRequirements = z.infer<typeof ParsedRequirementsSchema>

export function toRequirements(parsed: ParsedRequirements): Requirements {
  const { summary, ...rest } = parsed
  void summary
  return { ...rest, budget: rest.budget === null || Number.isNaN(rest.budget) ? null : Math.max(0, rest.budget) }
}
