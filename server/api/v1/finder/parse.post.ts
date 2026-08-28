import { createHash } from 'node:crypto'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { FEATURES, HOSTS, LAYERS, PLANS, PLATFORMS, PROVIDERS } from '#shared/enums'
import { ParsedRequirementsSchema } from '#shared/finder'

// Overridable without a deploy: NUXT_FINDER_MODEL. Luna matched Sonnet 5 on 18 finder queries
// across 12 runs, for a twentieth of the cost and half the latency, and never filled a filter
// nobody asked for. It reads long pages badly, so it earns this job and not the agent's.
const MODEL = process.env.NUXT_FINDER_MODEL || 'openai/gpt-5.6-luna'

const BodySchema = z.object({
  query: z.string().trim().min(3).max(300)
})

function options(list: readonly { value: string, label: string, description?: string }[]) {
  return list.map(o => `- ${o.value}: ${o.label}${o.description ? `, ${o.description}` : ''}`).join('\n')
}

const SYSTEM = `You turn one sentence from a developer into the filters of a directory of AI coding tools.
Only fill a field when the sentence says so. Never guess what they did not mention. Leave arrays empty and booleans false otherwise.

"Where you work" values (layer):
${options(LAYERS)}
Mapping hints: terminal, CLI, shell, tmux mean harness. IDE, editor, VS Code fork mean editor. "inside VS Code" or "plugin for JetBrains" mean extension plus the host. "run several agents", "parallel", "worktrees per task", "control plane" mean orchestrator. "in the browser", "from a ticket", "from Slack", "hosted" mean cloud. "build an app from a prompt" means app-builder.

Hosts:
${options(HOSTS)}

Platforms:
${options(PLATFORMS)}

Plans they may already pay for:
${options(PLANS)}
"Claude Max", "Claude Pro", "Anthropic subscription" mean claude. "ChatGPT Plus", "OpenAI subscription", "Codex" as a plan mean chatgpt. "Copilot" means copilot. "Cursor Pro" means cursor. "Gemini", "Google AI Pro" mean gemini. "SuperGrok" means grok.

Providers:
${options(PROVIDERS)}
Naming a plan is not naming a provider. "I have Claude Max" fills plans only, leave providers empty unless they asked for the models themselves.

Features:
${options(FEATURES)}

Budget is USD per month. Put tool or vendor names that should be searched by name into q.`

type FinderResponse = { parsed: z.infer<typeof ParsedRequirementsSchema>, usage: { input?: number, output?: number, cached?: number } }

function sha(text: string) {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

/** Everything that can change what a sentence parses to. A deploy that touches any of it starts a fresh namespace. */
const PARSER_VERSION = sha(MODEL + SYSTEM + JSON.stringify(z.toJSONSchema(ParsedRequirementsSchema)))

/** The same sentence with different case or spacing is the same sentence. */
function cacheKey(query: string) {
  return `${PARSER_VERSION}:${sha(query.toLowerCase().replace(/\s+/g, ' '))}`
}

export default defineEventHandler(async (event) => {
  const body = BodySchema.safeParse(await readBody(event))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'query must be 3 to 300 characters' })
  }

  const key = cacheKey(body.data.query)
  const hit = await finderStorage.getItem<FinderResponse>(key).catch(() => null)
  if (hit) return hit

  try {
    const { output, usage } = await generateText({
      model: MODEL,
      system: SYSTEM,
      prompt: body.data.query,
      output: Output.object({ schema: ParsedRequirementsSchema }),
      maxOutputTokens: 400,
      temperature: 0,
      // The system prompt plus the output schema is a stable prefix of about 1500 tokens, over
      // every provider's minimum. OpenAI caches it on its own, measured 1513 of 1531 input tokens
      // read from cache with no option set. Anthropic only caches behind an explicit marker, so
      // this is what keeps the prefix cached when NUXT_FINDER_MODEL points at a Claude model,
      // measured 0 to 3071 cache reads and a quarter of the cost per call. No-op elsewhere.
      providerOptions: {
        gateway: {
          caching: 'auto'
        }
      }
    })
    const response: FinderResponse = {
      parsed: output,
      usage: { input: usage.inputTokens, output: usage.outputTokens, cached: usage.inputTokenDetails.cacheReadTokens }
    }
    await finderStorage.setItem(key, response).catch(() => {})
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[finder] parse failed', message)
    if (/unauthenticated|api key|credentials|oidc|free tier|credits/i.test(message)) {
      throw createError({ statusCode: 503, statusMessage: 'Natural language search is not configured' })
    }
    throw createError({ statusCode: 502, statusMessage: 'The model could not parse that' })
  }
})
