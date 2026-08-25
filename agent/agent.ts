import { defineAgent } from 'eve'

export default defineAgent({
  // Sonnet 5 matched every costlier model at reading a pricing capture from content/snapshots,
  // and the cheaper models that tied it there are unproven at driving the browser and git side
  // of a sweep. Effort is the dial that pays here, not the tier.
  model: 'anthropic/claude-sonnet-5',
  reasoning: 'high',
  limits: {
    // A full pricing sweep reads ~60 vendor pages and a repo checkout. This is a runaway guard, not a budget.
    maxInputTokensPerSession: 6_000_000,
    maxOutputTokensPerSession: 120_000
  }
})
