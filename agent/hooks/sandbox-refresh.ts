import { defineHook } from 'eve/hooks'
import { hasCheckout, prepareCheckout } from '../lib/checkout'
import { brokeredGitPolicy } from '../lib/network-policy'

/**
 * Reapply the brokered credential every turn, and re-clone when the workspace is gone.
 *
 * `onSession` runs once per durable session, but a GitHub App installation token lasts about
 * an hour while a GitHub thread's session lives for days, and a provider-loss replacement
 * sandbox keeps the session key without rerunning `onSession` at all. Both leave a session
 * whose git reads fail. Neither can hand the sandbox more than it had: the factory baseline
 * carries no credential and nothing here can push, so a refresh that fails costs read access
 * and never grants write access. That is why this warns instead of failing the turn.
 */
export default defineHook({
  events: {
    async 'turn.started'(_event, ctx) {
      try {
        const sandbox = await ctx.getSandbox()
        await sandbox.setNetworkPolicy(await brokeredGitPolicy())
        // Only when it is actually missing: a checkout reset mid-thread would throw away
        // edits the previous turn made. The answer is passed along so it is asked once.
        const present = await hasCheckout(sandbox)
        if (!present) await prepareCheckout(sandbox, present)
      } catch (error) {
        console.warn('[agent] Could not refresh the sandbox credential:', error instanceof Error ? error.message : error)
      }
    }
  }
})
