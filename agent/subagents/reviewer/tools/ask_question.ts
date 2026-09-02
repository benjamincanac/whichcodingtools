import { disableTool } from 'eve/tools'

/**
 * A declared subagent inherits nothing from the root's tools, so the root's `disableTool()`
 * on `ask_question` does not reach here, while the channel turn's ability to ask does: eve
 * hands a child the parent's capabilities, and a child's question is proxied up to the root
 * channel, which on GitHub is a comment in a stranger's thread that then waits for an answer.
 * The reviewer returns findings; a capture it needs and did not get is a finding.
 */
export default disableTool()
