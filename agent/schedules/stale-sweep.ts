import { defineSchedule } from 'eve/schedules'

/** Weekly, Thursday 12:00 UTC, after the daily pricing sweep has finished. */
export default defineSchedule({
  cron: '0 12 * * 4',
  markdown: 'Load the stale-sweep skill and re-verify every tool whose sources are older than 60 days. Finish with a one-paragraph report.'
})
