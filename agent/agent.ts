import { defineAgent } from 'eve'

export default defineAgent({
  // Sonnet 5 matched every costlier model at reading a pricing capture from content/snapshots,
  // and the cheaper models that tied it there are unproven at driving the browser and git side
  // of a sweep. Effort is the dial that pays here, not the tier.
  model: 'anthropic/claude-sonnet-5',
  reasoning: 'high',
  // Sonnet 5 answers on a 1M window and eve compacts at 90% of it by default, so no turn of
  // this agent ever compacted: every model call re-sent the whole transcript, captures
  // included. A quarter of the window keeps one call under about 250K tokens. Each compaction
  // is one more model call and resets read-before-write on the files the turn touched, and
  // both are cheaper than carrying a 900K transcript into every step of a sixty-page sweep.
  compaction: { thresholdPercent: 0.25 },
  limits: {
    // Both caps sum what the provider reports over every model call of the session, and every
    // call carries the transcript again, so the input figure is roughly steps times context,
    // not what a turn read. The reviewer's calls are charged to the same session. At 6M the
    // first responder on #67 was cut off fourteen minutes into writing one file, and eve then
    // asked the issue thread for more budget. Sized for the daily sweep, sixty pages in one
    // session, as a runaway guard rather than a budget: eve's own default is 40M.
    maxInputTokensPerSession: 30_000_000,
    // Every reviewer hand-off is output: the captures travel inside the message it sends.
    maxOutputTokensPerSession: 400_000
  }
})
