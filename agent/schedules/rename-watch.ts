import { defineSchedule } from 'eve/schedules'

/** Weekly, Monday 06:45 UTC, after the pricing sweep. */
export default defineSchedule({
  cron: '45 6 * * 1',
  markdown: 'Load the rename-watch skill and run it over every tool in content/tools. Deliver issues for renames, moved domains and dead links. Finish with a one-paragraph report.'
})
