import { defineSchedule } from 'eve/schedules'

/** Daily, 06:15 UTC. Task mode: no channel, the deliverables are draft PRs and issues. */
export default defineSchedule({
  cron: '15 6 * * *',
  markdown: 'Load the pricing-watch skill and run it over every tool in content/tools. Deliver draft pull requests for real pricing changes and issues for pages that could not be checked. Finish with a one-paragraph report.'
})
