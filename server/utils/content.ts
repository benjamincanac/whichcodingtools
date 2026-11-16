import { comarkContent, type JsonSchema, type Source } from 'comark-content'
import fs from 'comark-content/sources/fs'
import forge from 'comark-content/sources/forge'
import yaml from 'comark-content/plugins/yaml'
import schemaValidation from 'comark-content/plugins/schema-validation'
import tracingDebug from 'comark-content/plugins/tracing/debug'
import { github } from 'forges/github'
import { toolJsonSchema } from '#shared/schema'

/**
 * The content layer. One source, one file per tool, validated against the JSON Schema derived
 * from `shared/schema.ts`.
 *
 * In development it reads `content/tools` from disk and watches it. In production it reads the
 * same directory from GitHub at request time, pinned to the latest commit that touched it, so a
 * merged data PR is live after the push webhook without a redeploy.
 */

type Content = ReturnType<typeof createContent>

let instance: Promise<Content> | undefined
let instanceRef: string | undefined

function source(ref: string): Source {
  const schema = toolJsonSchema() as JsonSchema
  if (!remoteContent()) {
    return fs('./content/tools', { schema })
  }
  const token = githubToken()
  return forge({
    provider: github(token ? { auth: { type: 'token', token } } : {}),
    repo: githubRepo(),
    ref,
    path: contentDir(),
    schema
  })
}

export function createContent(ref: string) {
  return comarkContent({
    source: source(ref),
    plugins: [
      // In dev a bad file should be loud. In production CI already validated what was merged,
      // so a surprise is dropped with a log line instead of taking the site down.
      yaml({ onError: import.meta.dev ? 'throw' : 'warn' }),
      schemaValidation({ onError: import.meta.dev ? 'throw' : 'ignore' }),
      tracingDebug()
    ],
    cache: { driver: contentCacheDriver(ref) }
  })
}

/** The ref the current instance reads, the commit SHA in production. */
export function contentRef() {
  return instanceRef ?? contentBranch()
}

/** Shared instance, rebuilt when the content SHA on the branch advances. */
export async function getContent(): Promise<Content> {
  const ref = await resolveContentSha(contentBranch())
  if (instance && instanceRef !== ref) {
    console.log(`[content] ${instanceRef} -> ${ref}`)
    instance = undefined
  }
  if (!instance) {
    instanceRef = ref
    instance = (async () => {
      const content = createContent(ref)
      if (import.meta.dev) await content.watch()
      return content
    })().catch((error) => {
      instance = undefined
      throw error
    })
  }
  return instance
}
