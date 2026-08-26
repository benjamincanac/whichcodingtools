import { lowerLabel } from '../enums'

/** A comma separated list, or a fallback when there is nothing to list. */
export function joinLabels(values: string[], fallback = 'None') {
  return values.length ? values.join(', ') : fallback
}

/** `https://www.augmentcode.com/` -> `augmentcode.com`, so a cell stays narrow. */
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

/** "Editor" -> "an editor", "Harness" -> "a harness". */
export function articleFor(label: string) {
  return `${/^[aeiou]/i.test(label) ? 'an' : 'a'} ${lowerLabel(label)}`
}
