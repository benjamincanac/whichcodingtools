import { defineHook } from 'eve/hooks'
import { prepareCheckout } from '../lib/checkout'
import { brokeredGitPolicy } from '../lib/network-policy'
import { workingBranch } from '../lib/thread'

/**
 * Reapply the brokered credential every turn, and put the checkout where this turn starts.
 *
 * `onSession` runs once per durable session, but a GitHub App installation token lasts about
 * an hour while a GitHub thread's session lives for days, and a provider-loss replacement
 * sandbox keeps the session key without rerunning `onSession` at all. Both leave a session
 * whose git reads fail. Neither can hand the sandbox more than it had: the factory baseline
 * carries no credential and nothing here can push, so a refresh that fails costs read access
 * and never grants write access. That is why this warns instead of failing the turn.
 *
 * The checkout moves every turn too, not only when it is missing. Main moves under a thread
 * that lives for days, and a file edited on the main of last Monday and pushed on Thursday
 * carries a commit that reverts everything that landed in it since. So each turn starts at the
 * remote tip: of the branch this session last pushed to, which is where its work is, or of
 * main. What the previous turn pushed is on that branch; what it did not push is gone, and was
 * abandoned when that turn ended.
 */
export default defineHook({
  events: {
    async 'turn.started'(_event, ctx) {
      try {
        const sandbox = await ctx.getSandbox()
        await sandbox.setNetworkPolicy(await brokeredGitPolicy())
        const wanted = workingBranch.get()
        const ref = await prepareCheckout(sandbox, undefined, wanted)
        // A branch that is gone from the remote merged or was deleted; main is the place again.
        if (wanted !== null && ref !== wanted) workingBranch.update(() => null)
      } catch (error) {
        console.warn('[agent] Could not refresh the sandbox:', error instanceof Error ? error.message : error)
      }
    }
  }
})
