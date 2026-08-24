import { REPO } from './github'

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

/**
 * Clone or refresh `/workspace/repo` at the tip of main. `checkout -f` and `clean -fd`
 * discard whatever a previous run left behind: an uncommitted edit surviving into the next
 * session is how one tool's half-finished YAML ends up in another tool's pull request.
 * `clean` leaves ignored paths alone, so node_modules survives.
 *
 * `present` is the caller's answer to `hasCheckout` when it already asked, so the turn hook
 * does not pay for the same probe twice.
 */
export async function prepareCheckout(sandbox: Runner, present?: boolean) {
  const exists = present ?? await hasCheckout(sandbox)
  if (!exists) {
    // A clone lands on origin/main's tip already, so there is nothing to fetch afterwards.
    await run(sandbox, `rm -rf /workspace/repo && git clone --depth 50 '${CLONE_URL}' /workspace/repo`)
    await run(sandbox, 'pnpm install --frozen-lockfile', '/workspace/repo')
    return
  }
  await run(sandbox, 'git fetch origin main && git checkout -f -B main origin/main && git clean -fd && pnpm install --frozen-lockfile', '/workspace/repo')
}
