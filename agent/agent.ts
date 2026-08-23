import { defineAgent } from 'eve'

export default defineAgent({
  model: 'anthropic/claude-sonnet-5',
  reasoning: 'medium',
  limits: {
    // A full pricing sweep reads ~60 vendor pages and a repo checkout. This is a runaway guard, not a budget.
    maxInputTokensPerSession: 6_000_000,
    maxOutputTokensPerSession: 120_000
  }
})
