import { defineSchedule } from 'eve/schedules'

/** Weekly, Wednesday 12:00 UTC. The one free weekday slot, and it sits after Tuesday's
 * discovery so the entries this pass reports with no slug are already a day old to it. */
export default defineSchedule({
  cron: '0 12 * * 3',
  markdown: 'Load the acp-watch skill and run it. Deliver at most one pull request, for tools whose own vendor page documents ACP today and for the wraps of the registry\'s two clients. Finish with a one-paragraph report naming the entries that have no slug yet.'
})
