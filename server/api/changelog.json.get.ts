export default defineEventHandler(async () => ({
  generated_at: new Date().toISOString(),
  entries: await readChangelog()
}))
