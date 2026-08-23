export default defineEventHandler(() => ({
  generated_at: new Date().toISOString(),
  entries: readChangelog()
}))
