import { AGENT_BRANCH, DEFAULT_BRANCH, REPO } from './github'

const CLONE_URL = `https://github.com/${REPO}.git`

/** The slice of a sandbox handle this file needs, shared by `onSession` and the turn hook. */
interface Runner {
  run(options: { command: string, workingDirectory?: string }): PromiseLike<{ exitCode: number, stdout: string, stderr: string }>
}

/**
 * Run a command and fail loudly. The sandbox `run` primitive resolves with an exit code
 * rather than throwing, and eve's session wrapper only throws on exit 1, so an unchecked
 * git failure (exit 128) would leave the agent working on a stale checkout and opening a
 * PR whose diff reverts whatever landed since.
 */
export async function run(sandbox: Runner, command: string, workingDirectory?: string) {
  const result = await sandbox.run({ command, workingDirectory })
  if (result.exitCode !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim()
    throw new Error(`Sandbox command failed (exit ${result.exitCode}): ${command}${detail ? `\n${detail}` : ''}`)
  }
  return result.stdout
}

export async function hasCheckout(sandbox: Runner) {
  const result = await sandbox.run({ command: '[ -d /workspace/repo/.git ]' })
  return result.exitCode === 0
}

/** Whether `branch` still exists on the remote. A fetch that fails is the answer, not an error. */
async function remoteHas(sandbox: Runner, branch: string) {
  const result = await sandbox.run({ command: `git fetch origin '${branch}'`, workingDirectory: '/workspace/repo' })
  return result.exitCode === 0
}

/**
 * Clone `/workspace/repo` when it is gone, then put it at the remote tip of `branch` when one
 * is given and still exists, of main otherwise, and say which. `checkout -f` and `clean -fd`
 * discard whatever the previous turn left uncommitted: what it pushed is on its branch, and
 * what it did not push was abandoned when it ended, and an edit surviving into the next turn
 * is how one tool's half-finished YAML ends up in another tool's pull request. `clean` leaves
 * ignored paths alone, so node_modules survives.
 *
 * `present` is the caller's answer to `hasCheckout` when it already asked, so the turn hook
 * does not pay for the same probe twice.
 */
export async function prepareCheckout(sandbox: Runner, present?: boolean, branch: string | null = null) {
  const exists = present ?? await hasCheckout(sandbox)
  if (!exists) {
    // Full history on purpose: the repository is small, and a shallow clone has no merge base
    // for a pull request older than its depth, which turns the triage pass's `git diff main
    // origin/pr/<n>` into a diff of two unrelated trees and its merge into a refusal.
    await run(sandbox, `rm -rf /workspace/repo && git clone '${CLONE_URL}' /workspace/repo`)
  }
  // The name went through `github__push_files`, which only accepts this shape, so it is shell-safe.
  if (branch !== null && !AGENT_BRANCH.test(branch)) throw new Error(`Refusing to check out ${JSON.stringify(branch)}.`)
  const ref = branch !== null && await remoteHas(sandbox, branch) ? branch : DEFAULT_BRANCH
  await run(sandbox, `git fetch origin '${ref}' && git checkout -f -B '${ref}' 'origin/${ref}' && git clean -fd && pnpm install --frozen-lockfile`, '/workspace/repo')
  return ref
}
