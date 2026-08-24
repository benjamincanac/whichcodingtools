import { defineSchedule } from 'eve/schedules'

/** Weekly, Thursday 06:45 UTC. */
export default defineSchedule({
  cron: '45 6 * * 4',
  markdown: 'Load the stale-sweep skill and re-verify every tool whose sources are older than 60 days. Finish with a one-paragraph report.'
})
