export default defineEventHandler(async () => {
  const tools = await loadTools()
  return {
    count: tools.length,
    generated_at: new Date().toISOString(),
    tools
  }
})
