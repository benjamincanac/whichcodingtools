/**
 * Content rules that are pure predicates, kept out of `validate.ts` so they can be tested.
 * The script itself runs its checks at import and exits, which leaves nothing to assert against.
 */
import type { Provider } from '../shared/enums'

/**
 * `first-party` is for vendors the PROVIDERS enum does not name: Cursor's models, Devin's,
 * Mellum. A vendor the enum does name declares its own value, the way claude-code declares
 * `anthropic`, or the xAI filter never finds the xAI tools. `vendor` is free text, so each
 * provider lists the names it ships under and a name matches as a whole word: "Moonshot AI"
 * and "Mistral, Inc." match, "Metabob" is not Meta. The list is keyed by enum value, not the
 * UI label, so a filter-chip rename cannot switch the check off. The routers have no entry,
 * no vendor is OpenRouter or a gateway.
 */
const PROVIDER_VENDORS = {
  anthropic: ['anthropic'],
  openai: ['openai'],
  google: ['google'],
  xai: ['xai', 'x.ai'],
  mistral: ['mistral'],
  deepseek: ['deepseek'],
  meta: ['meta'],
  moonshot: ['moonshot'],
  alibaba: ['alibaba', 'qwen', 'tongyi'],
  zhipu: ['zhipu', 'z.ai'],
  minimax: ['minimax']
} satisfies Record<Exclude<Provider, 'first-party' | 'openrouter' | 'vercel-ai-gateway'>, string[]>

/** Every regex metacharacter escaped, so "Z.ai" can be searched for as written. */
export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PROVIDER_PATTERNS = Object.entries(PROVIDER_VENDORS).map(([provider, aliases]) =>
  [provider as keyof typeof PROVIDER_VENDORS, aliases.map(alias => new RegExp(`\\b${escapeRegExp(alias)}\\b`))] as const
)

export function namedProviderFor(vendor: string) {
  const name = vendor.toLowerCase()
  return PROVIDER_PATTERNS.find(([, patterns]) => patterns.some(pattern => pattern.test(name)))?.[0]
}

/**
 * A note saying something is "not in the directory" is a claim about this repository, not about
 * the vendor's page. Nothing re-reads it: the sweeps check a file against its sources, and this
 * one turns false when an unrelated entry lands, so it rots in place. `wraps` states coverage.
 *
 * The object has to be this directory or a coverage verb next to "here". A bare "not tracked"
 * is left alone on purpose: pricing notes say things like "usage is not tracked per seat", and a
 * check that cries wolf on those gets switched off. The word "directory" is taken bluntly on the
 * other hand: in this corpus it means this one, and a note using it in another sense is still
 * worth a second read.
 */
const COVERAGE_CLAIM = /\b(?:not|never|excluded|missing|absent)\b[a-z' ]{0,30}?(?:(?:in|from|on) (?:(?:the|this) )?directory|(?:tracked|listed|covered|included|carried) here)\b|\b(?:untracked|unlisted) here\b/i

export function claimsDirectoryCoverage(text: string) {
  return COVERAGE_CLAIM.test(text)
}
