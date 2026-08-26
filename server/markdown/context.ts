import type { ToolRecord } from '#shared/types/tool'
import type { ChangeCommit } from '../utils/changes'

/**
 * Everything a renderer needs, resolved once per request by the content source.
 *
 * Renderers are synchronous and pure given this: no data loading, no `useRuntimeConfig`, so a
 * page can be rendered against a fixture array and diffed.
 */
export interface MarkdownContext {
  tools: ToolRecord[]
  bySlug: Map<string, ToolRecord>
  /** GitHub permalink to a tool's YAML file, the provenance line under Sources. */
  yamlUrl: (slug: string) => string
  /**
   * Git history, and the one thing here that is not derived from `content/tools`. Loaded only
   * for `/changes`, because it is a network read and every other page would pay for it.
   */
  changes?: ChangeCommit[]
}

/**
 * One rendered page. Structurally the module's `AgentPage`: the body only, since the raw route
 * adds the frontmatter (title, description, canonical URL) and the sitemap trailer itself.
 */
export interface MarkdownPage {
  markdown: string
  title: string
  description?: string
  updatedAt?: string
}
