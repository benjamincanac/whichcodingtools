import type { Layer, Plan } from '../enums'

/**
 * Hand-written intros for the generated pages. Kept out of the enums so the
 * schema file stays short. Edit freely, this is prose, not data.
 */
export const LAYER_INTROS: Record<Layer, string> = {
  'harness': 'Terminal agents are the engines. They read the repo, edit files and run commands from your shell, and most of the other layers are ways to host one. Pricing usually comes from the vendor plan you sign in with, so the question is less what the tool costs and more which plan it needs.',
  'editor': 'AI-native editors ship the agent inside the editor. Most are VS Code forks, a few are written from scratch. They tend to sell their own plans with included usage and an overage rate, which is where the compare table earns its keep.',
  'extension': 'Extensions install into the editor you already use. They are the cheapest way to try a new model or provider, many are open source and bring your own key, and the host editor matters more than the operating system.',
  'app': 'First-party desktop apps bundle a vendor\'s own agent with a GUI: side by side sessions, visual diffs, scheduled tasks. They reuse the subscription the agent already needs, so they rarely add a bill.',
  'orchestrator': 'Orchestrators sit on top of terminal agents and run several at once, usually one git worktree per task. Most of them reuse the login of the agent they run, which is why "what does this cost on top of my Claude plan" is so often zero.',
  'cloud': 'Cloud agents work on your repository from a hosted sandbox, triggered from a ticket, a chat message or a web app. They bill by compute units or tasks rather than by seat, and the platform is the browser.',
  'app-builder': 'App builders turn a prompt into a deployed app. They are adjacent to coding tools rather than part of the set, included here because people compare them, with pricing that is almost always credit based.'
}

export const PLAN_INTROS: Record<Plan, string> = {
  claude: 'A Claude Pro, Max or Team subscription includes Claude Code. Anything that runs the Claude Code binary with your login, an orchestrator, an editor over ACP, the desktop app, costs nothing extra for model usage. Tools that call the Anthropic API with a key bill separately.',
  chatgpt: 'Every ChatGPT plan from Free up includes Codex, with usage shared in one five-hour window. Tools that run the Codex CLI with your ChatGPT login reuse that allowance. Some tools sign in with a ChatGPT account directly without being part of the plan.',
  copilot: 'GitHub Copilot plans carry a monthly credit allowance used by the editor extension, the CLI and the cloud coding agent. Tools that host Copilot over ACP reuse it.',
  cursor: 'Cursor plans include agent usage priced at model API rates. Orchestrators that drive the Cursor CLI agent reuse your Cursor account and its limits.',
  gemini: 'Google AI Pro and Ultra raise the Gemini CLI allowance above the free personal tier. Tools that run Gemini CLI with your Google account inherit that.',
  grok: 'SuperGrok plans give OAuth access to xAI models. A few terminal agents can sign in with that account instead of an API key.'
}
