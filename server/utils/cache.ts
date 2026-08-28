import { createStorage, type Driver } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'

/** A commit SHA is immutable, so anything keyed by it can live for a day. */
const CONTENT_TTL = 60 * 60 * 24
/** The branch head moves, so the pointer to it is short lived. */
const REF_TTL = 60

/** A finder sentence parses the same way until the prompt, the schema or the model changes, and the key carries all three. */
const FINDER_TTL = 60 * 60 * 24

/** Bump when the parser, the schema or the computed record shape changes, so old cache entries are skipped. */
export const CONTENT_VERSION = 'v1'

function onVercel() {
  return !import.meta.dev && Boolean(process.env.VERCEL)
}

/** Backs the comark manifest and parsed files for one content SHA. Memory outside Vercel. */
export function contentCacheDriver(sha: string): Driver {
  if (!onVercel()) return memoryDriver()
  return vercelRuntimeCache({ base: `content:${CONTENT_VERSION}:${sha}`, ttl: CONTENT_TTL })
}

/** Branch to content SHA pointer, shared by every function instance so one GitHub call serves all of them. */
export const refStorage = createStorage({
  driver: onVercel() ? vercelRuntimeCache({ base: 'content:refs', ttl: REF_TTL }) : memoryDriver()
})

/**
 * Parsed finder sentences. The six example queries on the home page are accepted with Tab and
 * arrive verbatim from every visitor who does that, so the same sentence should cost one model
 * call, not one per visitor.
 */
export const finderStorage = createStorage({
  driver: onVercel() ? vercelRuntimeCache({ base: 'finder', ttl: FINDER_TTL }) : memoryDriver()
})
