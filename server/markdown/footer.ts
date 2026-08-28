import { DATA_LICENSE } from '#shared/api'
import { link } from './md'

/**
 * The last block of every markdown twin, and through them of `llms-full.txt`. A reader that
 * lands on one document sees the terms on that document, not only on the index it never opened.
 */
export function dataLicense(): string {
  return `Data: ${DATA_LICENSE.name}. ${DATA_LICENSE.attribution}. Full terms in ${link('LICENSE-DATA', DATA_LICENSE.url)}.`
}
