export interface EnumOption<T extends string = string> {
  value: T
  label: string
  description?: string
  icon?: string
}

function values<const T extends readonly EnumOption[]>(options: T) {
  return options.map(o => o.value) as [T[number]['value'], ...T[number]['value'][]]
}

export const LAYERS = [
  { value: 'harness', label: 'Terminal agent', description: 'Runs in your shell and edits the repo directly' },
  { value: 'editor', label: 'AI-native IDE', description: 'A full editor with the agent built in' },
  { value: 'extension', label: 'Editor extension', description: 'Lives inside the editor you already use' },
  { value: 'app', label: 'Desktop app', description: 'A first-party app that bundles an agent' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Runs several agents side by side' },
  { value: 'cloud', label: 'Cloud agent', description: 'Works on your repo from a hosted sandbox' },
  { value: 'app-builder', label: 'App builder', description: 'Prompt-to-app products, adjacent to coding tools' }
] as const satisfies readonly EnumOption[]

export const PLATFORMS = [
  { value: 'macos', label: 'macOS', icon: 'i-simple-icons-apple' },
  { value: 'windows', label: 'Windows', icon: 'i-simple-icons-windows' },
  { value: 'linux', label: 'Linux', icon: 'i-simple-icons-linux' },
  { value: 'web', label: 'Web', icon: 'i-lucide-globe' },
  { value: 'ios', label: 'iOS', icon: 'i-lucide-smartphone' },
  { value: 'android', label: 'Android', icon: 'i-simple-icons-android' }
] as const satisfies readonly EnumOption[]

export const HOSTS = [
  { value: 'vscode', label: 'VS Code', icon: 'i-simple-icons-visualstudiocode' },
  { value: 'jetbrains', label: 'JetBrains', icon: 'i-simple-icons-jetbrains' },
  { value: 'neovim', label: 'Neovim', icon: 'i-simple-icons-neovim' },
  { value: 'xcode', label: 'Xcode', icon: 'i-simple-icons-xcode' },
  { value: 'zed', label: 'Zed', icon: 'i-simple-icons-zedindustries' },
  { value: 'emacs', label: 'Emacs', icon: 'i-simple-icons-gnuemacs' },
  { value: 'visual-studio', label: 'Visual Studio', icon: 'i-simple-icons-visualstudio' }
] as const satisfies readonly EnumOption[]

export const FEATURES = [
  { value: 'worktrees', label: 'Git worktrees', description: 'One isolated checkout per task' },
  { value: 'parallel-agents', label: 'Parallel agents', description: 'Several agents running at once' },
  { value: 'subagents', label: 'Subagents', description: 'The agent can delegate to child agents' },
  { value: 'mcp-client', label: 'MCP client', description: 'Connects to MCP servers' },
  { value: 'acp-client', label: 'ACP client', description: 'Hosts external agents over the Agent Client Protocol' },
  { value: 'acp-agent', label: 'ACP agent', description: 'Can be hosted by ACP clients such as Zed' },
  { value: 'browser-automation', label: 'Browser automation', description: 'Drives a browser to verify UI' },
  { value: 'sandboxing', label: 'Sandboxing', description: 'Runs commands in an isolated sandbox' },
  { value: 'remote-execution', label: 'Remote execution', description: 'Runs on a remote machine or over SSH' },
  { value: 'mobile-companion', label: 'Mobile companion', description: 'Follow or drive sessions from a phone' },
  { value: 'scheduled-tasks', label: 'Scheduled tasks', description: 'Automations that run on a schedule' },
  { value: 'diff-review', label: 'Diff review', description: 'Review and annotate changes in the tool' },
  { value: 'checkpoints', label: 'Checkpoints', description: 'Snapshot and roll back agent changes' },
  { value: 'plugins', label: 'Plugins', description: 'Extensible through plugins or a marketplace' },
  { value: 'hooks', label: 'Hooks', description: 'Run your own commands at lifecycle points' },
  { value: 'tab-completion', label: 'Tab completion', description: 'Inline code completions while typing' }
] as const satisfies readonly EnumOption[]

export const PROVIDERS = [
  { value: 'first-party', label: 'Vendor models', description: 'Models trained or hosted by the vendor itself', icon: 'i-lucide-building-2' },
  { value: 'anthropic', label: 'Anthropic', icon: 'i-simple-icons-anthropic' },
  { value: 'openai', label: 'OpenAI', icon: 'i-simple-icons-openai' },
  { value: 'google', label: 'Google', icon: 'i-simple-icons-google' },
  { value: 'xai', label: 'xAI', icon: 'i-simple-icons-x' },
  { value: 'mistral', label: 'Mistral', icon: 'i-simple-icons-mistralai' },
  { value: 'deepseek', label: 'DeepSeek', icon: 'i-simple-icons-deepseek' },
  { value: 'meta', label: 'Meta', icon: 'i-simple-icons-meta' },
  { value: 'moonshot', label: 'Moonshot', icon: 'i-simple-icons-moonshotai' },
  { value: 'alibaba', label: 'Alibaba', icon: 'i-simple-icons-qwen' },
  { value: 'zhipu', label: 'Zhipu', icon: 'i-lucide-box' },
  { value: 'minimax', label: 'MiniMax', icon: 'i-simple-icons-minimax' },
  { value: 'openrouter', label: 'OpenRouter', icon: 'i-simple-icons-openrouter' },
  { value: 'vercel-ai-gateway', label: 'Vercel AI Gateway', icon: 'i-simple-icons-vercel' }
] as const satisfies readonly EnumOption[]

export const PLANS = [
  { value: 'claude', label: 'Claude', description: 'Claude Pro, Max or Team', icon: 'i-simple-icons-anthropic' },
  { value: 'chatgpt', label: 'ChatGPT', description: 'ChatGPT Go, Plus, Pro or Business', icon: 'i-simple-icons-openai' },
  { value: 'copilot', label: 'GitHub Copilot', description: 'Copilot Pro, Pro+ or Business', icon: 'i-simple-icons-githubcopilot' },
  { value: 'cursor', label: 'Cursor', description: 'Cursor Pro, Pro+ or Ultra', icon: 'i-simple-icons-cursor' },
  { value: 'gemini', label: 'Google AI', description: 'Google AI Pro or Ultra', icon: 'i-simple-icons-googlegemini' },
  { value: 'grok', label: 'SuperGrok', description: 'xAI SuperGrok plans', icon: 'i-simple-icons-x' }
] as const satisfies readonly EnumOption[]

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'preview', label: 'Preview', description: 'Beta, experimental or pre-1.0' },
  { value: 'sunset', label: 'Sunset', description: 'Discontinued or merged into another product' }
] as const satisfies readonly EnumOption[]

export const LICENSE_KINDS = [
  { value: 'open-source', label: 'Open source', description: 'OSI-approved license' },
  { value: 'source-available', label: 'Source available', description: 'Code is public under a non-OSI license' },
  { value: 'proprietary', label: 'Proprietary' }
] as const satisfies readonly EnumOption[]

export const BYOK = [
  { value: 'none', label: 'No BYOK' },
  { value: 'partial', label: 'Partial BYOK', description: 'Your own key works for some features only' },
  { value: 'full', label: 'BYOK', description: 'Every feature works with your own key' }
] as const satisfies readonly EnumOption[]

export const WRAP_VIA = [
  { value: 'cli', label: 'CLI', description: 'Runs the tool\'s own binary' },
  { value: 'acp', label: 'ACP', description: 'Agent Client Protocol' },
  { value: 'sdk', label: 'SDK', description: 'Embeds the vendor\'s agent SDK' },
  { value: 'api', label: 'API', description: 'Calls the model API with a key' },
  { value: 'extension', label: 'Extension', description: 'Installs the tool as an extension' }
] as const satisfies readonly EnumOption[]

export const INSTALL_METHODS = ['npm', 'brew', 'winget', 'aur', 'cargo', 'pip', 'curl', 'download', 'app-store'] as const

export const AUDIENCES = ['individual', 'team', 'enterprise'] as const
export const PRICE_PER = ['user', 'flat'] as const
export const INCLUDED_UNITS = ['usd', 'credits', 'tokens', 'requests', 'completions', 'edits', 'messages'] as const
export const INCLUDED_PERIODS = ['month', 'week', 'once'] as const
export const OVERAGE_KINDS = ['api-list', 'credits', 'fixed', 'rate-limited', 'blocked'] as const
export const SOURCE_COVERS = ['pricing', 'platforms', 'models', 'wraps', 'features', 'license', 'general'] as const

export const LAYER_VALUES = values(LAYERS)
export const PLATFORM_VALUES = values(PLATFORMS)
export const HOST_VALUES = values(HOSTS)
export const FEATURE_VALUES = values(FEATURES)
export const PROVIDER_VALUES = values(PROVIDERS)
export const PLAN_VALUES = values(PLANS)
export const STATUS_VALUES = values(STATUSES)
export const LICENSE_KIND_VALUES = values(LICENSE_KINDS)
export const BYOK_VALUES = values(BYOK)
export const WRAP_VIA_VALUES = values(WRAP_VIA)

export type Layer = typeof LAYERS[number]['value']
export type Platform = typeof PLATFORMS[number]['value']
export type Host = typeof HOSTS[number]['value']
export type Feature = typeof FEATURES[number]['value']
export type Provider = typeof PROVIDERS[number]['value']
export type Plan = typeof PLANS[number]['value']

export function optionLabel(options: readonly EnumOption[], value: string) {
  return options.find(o => o.value === value)?.label ?? value
}
