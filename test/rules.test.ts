import { describe, expect, it } from 'vitest'
import { claimsDirectoryCoverage, namedProviderFor } from '~~/scripts/rules'

describe('a vendor that is a named provider', () => {
  it('maps the spellings the corpus and the vendors use', () => {
    expect(namedProviderFor('xAI (SpaceXAI)')).toBe('xai')
    expect(namedProviderFor('Moonshot AI')).toBe('moonshot')
    expect(namedProviderFor('Mistral, Inc.')).toBe('mistral')
    expect(namedProviderFor('Z.ai')).toBe('zhipu')
    expect(namedProviderFor('Qwen')).toBe('alibaba')
    expect(namedProviderFor('Alibaba')).toBe('alibaba')
    expect(namedProviderFor('Anthropic')).toBe('anthropic')
    expect(namedProviderFor('Meta Platforms, Inc.')).toBe('meta')
  })

  it('leaves alone the vendors that only look like one', () => {
    for (const vendor of ['Metabob', 'Cursor', 'Cognition', 'Charmbracelet, Inc.', 'Nous Research', 'Anysphere', 'Element Labs, Inc.']) {
      expect(namedProviderFor(vendor), vendor).toBeUndefined()
    }
  })
})

describe('a note that claims what this directory covers', () => {
  it('catches the phrasings the corpus had drifted into', () => {
    for (const note of [
      'Grok Build and OpenCode are supported too but not in the directory yet.',
      'Qwen CLI and Crush CLI are supported too but not in the directory.',
      'Amp also runs but is not tracked here.',
      'Copilot CLI, Amp and Droid are also detected but are not in this directory.',
      'Amp is also available as an ACP provider but is not listed in this directory.'
    ]) {
      expect(claimsDirectoryCoverage(note), note).toBe(true)
    }
  })

  it('catches the ways the same claim can be worded instead', () => {
    for (const note of [
      'Copilot runs too, excluded from the directory for now.',
      'Qwen Code is missing from this directory.',
      'Goose is supported but untracked here.',
      'Cline also runs and is unlisted here.',
      'Devin is supported but never covered here.',
      'Kiro also runs but is not in directory.',
      'Amp is supported, excluded from directory for now.'
    ]) {
      expect(claimsDirectoryCoverage(note), note).toBe(true)
    }
  })

  it('leaves alone the sentences that only look like one', () => {
    for (const note of [
      'On the Teams plan, credits are shared and usage is not tracked per member.',
      'Windows is not available yet and an iOS app is listed as coming soon.',
      'A one time Founders Edition is also sold, price not on the pricing page.',
      'Seats are not billed here, the parent account carries them.'
    ]) {
      expect(claimsDirectoryCoverage(note), note).toBe(false)
    }
  })
})
