import type { SandboxNetworkPolicy } from 'eve/sandbox'
import { gitAuthorizationHeader, REPO } from './github'

const REPO_PATH = REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * What a sandbox gets before any credential is brokered, and what a provider-loss
 * replacement comes up with when `onSession` never reruns: the open internet, no GitHub
 * credential anywhere. Vendor pages still read, the private repo does not.
 */
export const NO_CREDENTIALS: SandboxNetworkPolicy = { allow: { '*': [] } }

/**
 * The same, plus the GitHub credential on the two endpoints that READ the repository.
 * Nothing matches `git-receive-pack`, so a push from the sandbox goes out unauthenticated
 * and GitHub refuses it. That is the whole enforcement of "never a push to main": writes
 * leave through `github__push_files`, which runs in the app runtime and only ever moves
 * `refs/heads/agent/*`. Prose in the instructions is a reminder, not the guard.
 */
export async function brokeredGitPolicy(): Promise<SandboxNetworkPolicy> {
  const authorization = await gitAuthorizationHeader()
  return {
    allow: {
      'github.com': [
        {
          // Ref advertisement for clone, fetch and ls-remote.
          match: {
            method: ['GET'],
            path: { regex: `^/${REPO_PATH}(\\.git)?/info/refs$` },
            queryString: [{ key: { exact: 'service' }, value: { exact: 'git-upload-pack' } }]
          },
          transform: [{ headers: { authorization } }]
        },
        {
          // The pack negotiation itself. Protocol v2 uses these two endpoints and no other.
          match: {
            method: ['POST'],
            path: { regex: `^/${REPO_PATH}(\\.git)?/git-upload-pack$` }
          },
          transform: [{ headers: { authorization } }]
        }
      ],
      '*': []
    }
  }
}
