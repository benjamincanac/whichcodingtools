#!/usr/bin/env node
// Fetch a URL and print its visible text, one block per line, so pricing pages can be
// diffed and read without a browser. Usage: node /workspace/bin/page-text.mjs <url>
const url = process.argv[2]
if (!url) {
  console.error('usage: page-text.mjs <url>')
  process.exit(2)
}
const res = await fetch(url, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 whichcodingtools-agent',
    'accept': 'text/html,application/xhtml+xml'
  }
})
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText} for ${url}`)
  process.exit(1)
}
const html = await res.text()
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(br|p|div|li|h[1-6]|tr|section|article|header|footer|table|ul|ol)[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;|&apos;/g, '\'')
  .replace(/&quot;/g, '"')
  .split('\n')
  .map(line => line.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .join('\n')
console.log(`# ${res.url}\n# fetched ${new Date().toISOString().slice(0, 10)}\n`)
console.log(text)
