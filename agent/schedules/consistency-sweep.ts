import { defineSchedule } from 'eve/schedules'

/** Monthly, the 1st at 13:00 UTC. The one pass that reads the corpus side by side instead of
 * one file against its sources, so it sits an hour clear of whichever weekly lands that day. */
export default defineSchedule({
  cron: '0 13 1 * *',
  markdown: 'Load the consistency-sweep skill and run it over all of content/tools. Deliver at most one issue with the drift worth a decision. Finish with a one-paragraph report naming what you checked, what you filed and what you held back.'
})
