import { defineAgent } from 'eve'

/**
 * A second pair of eyes on a content diff before it becomes a pull request. It runs on a
 * stronger model than the sweep because the misses it exists to catch are the ones a sweep
 * makes while holding sixty vendor pages: a limit that repeats the price column, a note that
 * points at a table already on the page, a `min_tier` that changed meaning when the tiers did.
 * It has its own sandbox and no checkout, so everything it reviews arrives in the message.
 */
export default defineAgent({
  description: 'Reviews a content/ diff the way the site will render it and returns what to fix before the pull request opens. Give it the whole diff, the capture text every figure rests on and the vendor URLs, it sees nothing else and it changes nothing.',
  model: 'anthropic/claude-opus-5',
  reasoning: 'high',
  limits: {
    // One diff, its captures and a reply. A runaway guard, not a budget.
    maxInputTokensPerSession: 400_000,
    maxOutputTokensPerSession: 20_000
  }
})
