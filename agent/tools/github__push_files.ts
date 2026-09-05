import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { AGENT_BRANCH, REVERIFY_BRANCH, assertWritablePaths, branchExists, pushToAgentBranch } from '../lib/github'
import { ownBranches, workingBranch } from '../lib/thread'
import { isLimited, isTrustedAuthor } from '../lib/trust'

/** A YAML file is a few KB and a logo is a few dozen. Anything near this is a mistake. */
const MAX_BYTES = 2_000_000

export default defineTool({
  description: 'Commit files from the checkout onto an agent branch. This is how work leaves the sandbox: `git push` does not work there, on purpose. Edit the files in /workspace/repo, run `pnpm validate`, then list what changed here. Pushing to the branch of an open pull request adds a commit to it, and a turn that was started by someone other than Benjamin may only do that on a branch it opened itself.',
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
    const limited = isLimited(ctx.session.auth)
    // Claimed before the push rather than after it. State commits with the step, and eve can
    // re-run a step that was interrupted after the ref was already created: a claim made after
    // the push would then be lost, the branch would exist unowned, and the turn would be locked
    // out of its own work. Only a branch nobody has yet, so a refused push claims nothing that
    // was not free, and never the re-verification lane, which the push refuses outright.
    if (limited && !REVERIFY_BRANCH.test(branch) && !(await branchExists(branch))) {
      ownBranches.update(own => own.includes(branch) ? own : [...own, branch])
    }
    const pushed = await pushToAgentBranch({ branch, message, files, ...(limited ? { ownBranches: ownBranches.get() } : {}) })
    // Where the next turn of this session starts from.
    workingBranch.update(() => branch)
    return pushed
  }
})
