import { defineSchedule } from 'eve/schedules'

/** Weekly, Monday 12:00 UTC. Late enough that the 06:15 pricing sweep is done: two runs
 * over the same tool at once means two branches with the same name and a lost commit. */
export default defineSchedule({
  cron: '0 12 * * 1',
  markdown: 'Load the rename-watch skill and run it over every tool in content/tools. Deliver issues for renames, moved domains, dead links and descriptions the homepage no longer supports. Finish with a one-paragraph report.'
})
