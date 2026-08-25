import { defineSchedule } from 'eve/schedules'

/** Fridays, 09:00 UTC. After the week's sweeps have piled work up, before Benjamin's weekend. */
export default defineSchedule({
  cron: '0 9 * * 5',
  markdown: 'Load the triage skill and run it over every open issue and pull request. Close what settled itself, push fixes to the pull requests that no longer validate against main, and finish with one line per thread.'
})
