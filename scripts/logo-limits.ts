/** Shared by `scripts/logos.ts`, which fixes these, and `scripts/validate.ts`, which fails on them. */
import { join } from 'node:path'
import process from 'node:process'

export const LOGO_DIR = join(process.cwd(), 'public/logos')

/**
 * Twice the 48 CSS pixels of the largest avatar on the site, the one on a tool page header.
 * The target `scripts/logos.ts` resizes down to, not a rule on its own: a 420 square that
 * already weighs a kilobyte costs nobody anything, and re-encoding it only makes it bigger.
 */
export const LOGO_MAX_PX = 128

/** What a logo may weigh. Nothing legible at avatar size needs more, and `pnpm validate` says so. */
export const LOGO_MAX_BYTES = 24 * 1024

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

/**
 * A JPEG named `.png` still renders, because browsers sniff, but it is served as `image/png`
 * and no build step that trusts the extension can touch it.
 */
export function isPng(buf: Buffer) {
  return buf.subarray(0, 8).equals(PNG_MAGIC)
}
