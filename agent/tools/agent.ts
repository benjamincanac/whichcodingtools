import { disableTool } from 'eve/tools'

/**
 * eve's built-in `agent` tool runs a fresh copy of the root with the same tools and the same
 * auth but fresh state, and `currentThread` and `ownBranches` are state. A copy would post
 * into the thread its parent is answering in, since it does not know which one that is, and
 * be refused the branch its parent opened. The one delegate this agent has is the declared
 * `reviewer`, which is a subagent of its own and not this tool.
 */
export default disableTool()
