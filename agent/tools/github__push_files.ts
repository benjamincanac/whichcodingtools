import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { run } from '../lib/checkout'
import { AGENT_BRANCH, COMMUNITY_BRANCH, DEFAULT_BRANCH, assertWritablePaths, branchExists, pushToAgentBranch } from '../lib/github'
import { isLimitedSession, ownBranches, workingBranch } from '../lib/thread'
import { isTrustedAuthor } from '../lib/trust'

/** A YAML file is a few KB and a logo is a few dozen. Anything near this is a mistake. */
const MAX_BYTES = 2_000_000

export default defineTool({
  description: 'Commit files from the checkout onto an agent branch. This is how work leaves the sandbox: `git push` does not work there, on purpose. Edit the files in /workspace/repo, run `pnpm validate`, then list what changed here. Pushing to the branch of an open pull request adds a commit to it. A new branch is refused when one of the files changed on main after the checkout started. A turn that was started by someone other than Benjamin or a schedule, or that has read a thread such a person wrote in, pushes to `agent/community-<topic>-<YYYY-MM-DD>` and only to a branch it opened itself.',
  inputSchema: z.object({
    branch: z.string().regex(AGENT_BRANCH).describe('agent/<topic>-<YYYY-MM-DD>, or the branch of an open pull request for the same tool.'),
    message: z.string().min(8).max(120).describe('Commit message, like data(<slug>): <what changed>.'),
    paths: z.array(z.string()).min(1).max(50).describe('Paths relative to /workspace/repo, under content/ or public/logos/.')
  }),
  async execute({ branch, message, paths }, ctx) {
    if (!isTrustedAuthor(ctx.session.auth)) {
      throw new Error('This turn may not push anything. Say what you found instead.')
    }
    // Checked before the read, not only before the commit: these paths are resolved inside
    // the checkout, so a traversal would read a file the push would then refuse.
    assertWritablePaths(paths)
    const sandbox = await ctx.getSandbox()
    const files = await Promise.all(paths.map(async (path) => {
      const bytes = await sandbox.readBinaryFile({ path: `/workspace/repo/${path}`, abortSignal: ctx.abortSignal })
      if (!bytes) throw new Error(`Nothing to push at ${path}: no such file in the checkout.`)
      if (bytes.byteLength > MAX_BYTES) throw new Error(`${path} is ${bytes.byteLength} bytes, past the ${MAX_BYTES} byte limit.`)
      return { path, content: Buffer.from(bytes).toString('base64') }
    }))
    const limited = isLimitedSession(ctx.session.auth)
    const exists = await branchExists(branch)
    // A new branch is cut from main, and the push commits whole files. A file that moved on main
    // after this checkout started would go out as the old copy plus this turn's edit, a clean
    // fast-forward that reverts what landed in between, and nobody reads the diff before it
    // merges. So the commit the checkout stands on is compared with main as it is now, path by
    // path, and the branch is cut from the very commit that comparison read. The paths passed
    // `assertWritablePaths`, so they are shell-safe inside single quotes.
    let base: string | undefined
    if (!exists) {
      const out = await run(sandbox, `git fetch -q origin '${DEFAULT_BRANCH}' && for p in ${paths.map(p => `'${p}'`).join(' ')}; do git diff --quiet HEAD FETCH_HEAD -- "$p" || echo "moved $p"; done && git rev-parse FETCH_HEAD`, '/workspace/repo')
      const lines = out.trim().split('\n')
      const moved = lines.filter(line => line.startsWith('moved ')).map(line => line.slice(6))
      if (moved.length > 0) {
        throw new Error(`${moved.join(', ')} changed on ${DEFAULT_BRANCH} since this checkout started, or the checkout is on another branch. Nothing was pushed. Run \`git stash -u && git checkout -f -B ${DEFAULT_BRANCH} FETCH_HEAD && git stash pop\`, redo the edit against the file as it is now, validate, and push again.`)
      }
      base = lines.at(-1)
      if (!base || !/^[0-9a-f]{40}$/.test(base)) throw new Error('Could not read the tip of main in the checkout. Nothing was pushed.')
    }
    // Claimed before the push rather than after it. State commits with the step, and eve can
    // re-run a step that was interrupted after the ref was already created: a claim made after
    // the push would then be lost, the branch would exist unowned, and the turn would be locked
    // out of its own work. Only a branch nobody has yet, so a refused push claims nothing that
    // was not free, and only in the community namespace, since the push refuses every other.
    if (limited && COMMUNITY_BRANCH.test(branch) && !exists) {
      ownBranches.update(own => own.includes(branch) ? own : [...own, branch])
    }
    const pushed = await pushToAgentBranch({ branch, message, files, base, ...(limited ? { ownBranches: ownBranches.get() } : {}) })
    // Where the next turn of this session starts from.
    workingBranch.update(() => branch)
    return pushed
  }
})
