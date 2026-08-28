import { disableTool } from 'eve/tools'

/**
 * eve exposes `ask_question` on every channel turn that can reach a person, and the GitHub
 * channel renders a call as a comment with numbered options and an "answer by mentioning me"
 * footer. The one time the model reached for it, it was to ask whether it may post the reply
 * it had already written, which is a public comment that says nothing. A question worth asking
 * goes in the reply itself, where the person can mention the agent again.
 */
export default disableTool()
