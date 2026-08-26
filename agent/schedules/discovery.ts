import { defineSchedule } from 'eve/schedules'

/** Weekly, Tuesday 12:00 UTC. The one pass that looks outside `content/tools`, so it sits
 * clear of the daily pricing sweep and of the two weeklies that read the corpus itself. */
export default defineSchedule({
  cron: '0 12 * * 2',
  markdown: 'Load the discovery skill and run it. Deliver at most one issue, the best candidate the directory is missing. Finish with a one-paragraph report naming what each source returned, the candidates you held back and the ones you rejected, with the reason.'
})
