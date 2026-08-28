/**
 * Normalises `public/logos`: a real PNG, no wider than LOGO_MAX_PX, no heavier than
 * LOGO_MAX_BYTES. An avatar renders at 48 css pixels at the very largest, so a 384 square is
 * bytes nobody sees.
 *
 * It never writes a result bigger than what it read, unless the file was not a PNG at all.
 * Several of these are already quantised better than a re-encode manages, and growing a file
 * to satisfy a rule about its dimensions would be the wrong trade.
 *
 *   pnpm logos           report what is out of bounds
 *   pnpm logos --write   rewrite it
 *
 * `pnpm validate` fails on the same two limits, so a logo that skipped this script is caught.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import sharp from 'sharp'
import { LOGO_DIR, LOGO_MAX_BYTES, LOGO_MAX_PX, isPng } from './logo-limits'

const write = process.argv.includes('--write')

const files = (await readdir(LOGO_DIR)).filter(f => f.endsWith('.png')).sort()
let rewritten = 0
let saved = 0
const stuck: string[] = []

for (const file of files) {
  const path = join(LOGO_DIR, file)
  const before = await readFile(path)
  const notPng = !isPng(before)
  const heavy = before.byteLength > LOGO_MAX_BYTES
  if (!notPng && !heavy) continue

  const after = await sharp(before)
    .resize({ width: LOGO_MAX_PX, height: LOGO_MAX_PX, fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toBuffer()

  const reasons = [notPng && 'not a png', heavy && `${before.byteLength}B`].filter(Boolean).join(', ')
  if (after.byteLength > LOGO_MAX_BYTES && !notPng) {
    stuck.push(`${file} (${reasons}): re-encodes to ${after.byteLength}B, still over. Needs a smaller source image.`)
    continue
  }
  if (write) {
    await writeFile(path, after)
    rewritten++
    saved += before.byteLength - after.byteLength
  }
  console.log(`${file} (${reasons}) ${before.byteLength} -> ${after.byteLength}${write ? '' : ' [dry run]'}`)
}

if (stuck.length) {
  console.error(`\n${stuck.length} logo(s) this script cannot fix:`)
  for (const s of stuck) console.error(`  ${s}`)
}
console.log(`\n${files.length} logo(s), ${write ? `${rewritten} rewritten, ${saved} bytes saved` : 'dry run, pass --write to apply'}`)
process.exit(stuck.length ? 1 : 0)
