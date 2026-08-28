import { DATA_LICENSE } from '#shared/api'

export default defineEventHandler(async () => {
  const tools = await loadTools()
  return {
    count: tools.length,
    generated_at: new Date().toISOString(),
    license: { spdx: DATA_LICENSE.spdx, url: DATA_LICENSE.url, attribution: DATA_LICENSE.attribution },
    tools
  }
})
