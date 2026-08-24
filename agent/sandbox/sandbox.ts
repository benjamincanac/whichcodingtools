import { agentBrowserRevalidationKey, installAgentBrowser } from '@agent-browser/eve/sandbox'
import { defineSandbox } from 'eve/sandbox'
import { vercel } from 'eve/sandbox/vercel'
import { prepareCheckout, run } from '../lib/checkout'
import { brokeredGitPolicy, NO_CREDENTIALS } from '../lib/network-policy'

export default defineSandbox({
  // The credential-free policy lives on the factory, not only in onSession, because a
  // provider-loss replacement reuses the sandbox key and never reruns onSession. A
  // replacement therefore comes up able to read vendor pages and unable to touch the repo.
  backend: vercel({ resources: { vcpus: 2 }, networkPolicy: NO_CREDENTIALS }),
  // The template only warms tooling. The private repo is cloned per session, after the
  // brokered credentials are in place, so no token is ever written into the template image.
  revalidationKey: () => `whichcodingtools-workspace-v4:${agentBrowserRevalidationKey()}`,
  async bootstrap({ use }) {
    const sandbox = await use()
    // One round trip: none of these read another's output, and each `run` is a full RPC.
    // The corepack version matches package.json's packageManager pin, otherwise corepack
    // downloads that version again on every session and the one warmed here never runs.
    // The credential helper exits rather than prompting, so an unauthenticated push fails
    // in a second instead of blocking on a username nobody is there to type.
    await run(sandbox, [
      'corepack enable && corepack prepare pnpm@11.23.0 --activate',
      'git config --global user.name "whichcodingtools[bot]"',
      'git config --global user.email "whichcodingtools[bot]@users.noreply.github.com"',
      'git config --global --add safe.directory /workspace/repo',
      `git config --global credential.helper '!f() { exit 1; }; f'`
    ].join(' && '))
    await installAgentBrowser(sandbox)
  },
  async onSession({ use }) {
    const sandbox = await use({ networkPolicy: await brokeredGitPolicy() })
    await prepareCheckout(sandbox)
  }
})
