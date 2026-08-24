import { agentBrowserRevalidationKey, installAgentBrowser } from '@agent-browser/eve/sandbox'
import { defineSandbox } from 'eve/sandbox'
import type { SandboxNetworkPolicy } from 'eve/sandbox'
import { vercel } from 'eve/sandbox/vercel'
import { gitAuthorizationHeader, REPO } from '../lib/github'

const CLONE_URL = `https://github.com/${REPO}.git`

/**
 * Egress policy: everything open (vendor pricing pages live anywhere), with the GitHub
 * token injected at the firewall for github.com so the sandbox can clone and push a private
 * repo without ever holding the secret. Credential brokering needs the Vercel Sandbox backend,
 * which is also what `eve dev` uses here (the project is linked, the OIDC token is in .env.local).
 */
async function networkPolicy(): Promise<SandboxNetworkPolicy> {
  return {
    allow: {
      'github.com': [{ transform: [{ headers: { authorization: await gitAuthorizationHeader() } }] }],
      '*': []
    }
  }
}

export default defineSandbox({
  backend: vercel({ resources: { vcpus: 2 } }),
  // The template only warms tooling. The private repo is cloned per session, after the brokered
  // credentials are in place, so no token is ever written into the template image.
  revalidationKey: () => `whichcodingtools-workspace-v3:${agentBrowserRevalidationKey()}`,
  async bootstrap({ use }) {
    const sandbox = await use()
    await sandbox.run({ command: 'corepack enable && corepack prepare pnpm@10.33.4 --activate' })
    await sandbox.run({ command: 'git config --global user.name "whichcodingtools[bot]" && git config --global user.email "whichcodingtools[bot]@users.noreply.github.com"' })
    await installAgentBrowser(sandbox)
  },
  async onSession({ use }) {
    const sandbox = await use({ networkPolicy: await networkPolicy() })
    await sandbox.run({ command: `[ -d repo ] || git clone --depth 50 ${CLONE_URL} repo` })
    await sandbox.run({ command: 'git config --global --add safe.directory /workspace/repo' })
    await sandbox.run({ command: 'cd repo && git fetch origin main && git checkout -B main origin/main && pnpm install --frozen-lockfile' })
  }
})
