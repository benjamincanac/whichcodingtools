import { eveChannel } from 'eve/channels/eve'
import { localDev, vercelOidc } from 'eve/channels/auth'

export default eveChannel({
  auth: [
    // The eve TUI and Vercel deployments.
    vercelOidc(),
    // `eve dev` on localhost.
    localDev()
  ]
})
