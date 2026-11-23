import { agentBrowserRevalidationKey, installAgentBrowser } from '@agent-browser/eve/sandbox'
import { defineSandbox } from 'eve/sandbox'
import { VercelSandbox } from 'eve/sandbox/vercel'
import { prepareCheckout, run } from '../lib/checkout'
import { brokeredGitPolicy, NO_CREDENTIALS } from '../lib/network-policy'
import { packageManager } from '../../package.json'

/**
 * The template only warms tooling. The private repo is cloned per session, after the brokered
 * credentials are in place, so no token is ever written into the template image.
 */
export const environment = VercelSandbox.environment({
  resources: { vcpus: 2 },
  // The credential-free policy is what every sandbox is created with, the template included.
  // The read credential only ever arrives through `setNetworkPolicy`, from the selector below
  // or the turn hook, and neither can hand out more than read access.
  networkPolicy: NO_CREDENTIALS,
  // Part of the template key. The template holds this pnpm and this agent-browser, and the
  // `prepare` source below does not change when package.json or the extension does.
  env: { WHICHCODINGTOOLS_TEMPLATE: `v6:${packageManager}:${agentBrowserRevalidationKey()}` },
  async prepare(sandbox) {
    // One round trip: none of these read another's output, and each `run` is a full RPC.
    // eve's image ships no pnpm. The version is package.json's packageManager pin, otherwise
    // pnpm switches to that version on every session and the one installed here never runs.
    // The credential helper exits rather than prompting, so an unauthenticated push fails
    // in a second instead of blocking on a username nobody is there to type.
    await run(sandbox, [
      `npm install -g ${packageManager}`,
      'git config --global user.name "whichcodingtools[bot]"',
      'git config --global user.email "whichcodingtools[bot]@users.noreply.github.com"',
      'git config --global --add safe.directory /workspace/repo',
      `git config --global credential.helper '!f() { exit 1; }; f'`
    ].join(' && '))
    await installAgentBrowser(sandbox)
  }
})

/**
 * Runs until it succeeds once per sandbox, and again when the sandbox is gone or a previous run
 * failed half way, so every step here is safe to repeat.
 */
export default defineSandbox(async () => {
  const sandbox = await environment.open()
  await sandbox.setNetworkPolicy(await brokeredGitPolicy())
  await prepareCheckout(sandbox)
  return sandbox
})
