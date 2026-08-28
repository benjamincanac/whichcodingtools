import type { Requirements } from './utils/match'

/**
 * What the natural-language box turns a sentence into. The model fills this, the
 * deterministic matcher does the ranking, so the model never decides which tool wins.
 *
 * An interface rather than `z.infer<>`: the landing page imports `toRequirements` from this
 * file, and a `z.object()` at module scope would pull the whole of zod into the client bundle.
 * `server/utils/finder.ts` holds the schema and is checked against this shape.
 */
export interface ParsedRequirements extends Requirements {
  summary: string
}

export function toRequirements(parsed: ParsedRequirements): Requirements {
  const { summary, ...rest } = parsed
  void summary
  return { ...rest, budget: rest.budget === null || Number.isNaN(rest.budget) ? null : Math.max(0, rest.budget) }
}
