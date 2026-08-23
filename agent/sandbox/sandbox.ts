import { defaultBackend, defineSandbox } from 'eve/sandbox'
import { gitAuthorizationHeader, REPO } from '../lib/github'

const CLONE_URL = `https://github.com/${REPO}.git`

/**
 * Egress policy: everything open (vendor pricing pages live anywhere), with the GitHub
 * token injected at the firewall for github.com so the sandbox can clone and push a private
 * repo without ever holding the secret. Credential brokering needs the Vercel or microsandbox
 * backend; on the Docker backend used by some local setups the policy falls back to allow-all
 * and the token is written to a git credential helper instead (dev only).
 */
function networkPolicy() {
  return {
    allow: {
      'github.com': [{ transform: [{ headers: { authorization: gitAuthorizationHeader() } }] }],
      '*': []
    }
  }
}

export default defineSandbox({
  backend: defaultBackend({
    vercel: { networkPolicy: networkPolicy(), resources: { vcpus: 2 } }
  }),
  // Bump to rebuild the template (clone + install) after a lockfile or tooling change.
  revalidationKey: () => 'whichcodingtools-workspace-v1',
  async bootstrap({ use }) {
    const sandbox = await use()
    if (!process.env.VERCEL) {
      // Local backends may not broker credentials: store them for git instead. Never on Vercel.
      const token = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
      await sandbox.run({ command: `git config --global credential.helper store && printf 'https://x-access-token:%s@github.com\\n' '${token}' > ~/.git-credentials` })
    }
    await sandbox.run({ command: `git clone --depth 50 ${CLONE_URL} repo` })
    await sandbox.run({ command: 'cd repo && corepack enable && corepack prepare --activate && pnpm install --frozen-lockfile' })
    await sandbox.run({ command: 'git config --global user.name "whichcodingtools-agent" && git config --global user.email "agent@whichcodingtools.invalid"' })
  },
  async onSession({ use }) {
    const sandbox = await use({ networkPolicy: networkPolicy() })
    await sandbox.run({ command: 'git config --global --add safe.directory /workspace/repo' })
    await sandbox.run({ command: 'cd repo && git fetch origin main && git checkout -B main origin/main' })
  }
})
