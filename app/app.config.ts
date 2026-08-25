export default defineAppConfig({
  site: {
    name: 'whichcoding.tools',
    tagline: 'Find the AI coding tool that fits how you work.',
    repo: 'benjamincanac/whichcodingtools',
    branch: 'main'
  },
  ui: {
    colors: {
      primary: 'neutral',
      neutral: 'neutral'
    },
    container: {
      base: 'px-6'
    },
    header: {
      slots: {
        root: 'backdrop-blur-none bg-default',
        right: 'gap-2'
      }
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted',
        right: 'gap-x-2'
      }
    },
    navigationMenu: {
      slots: {
        link: 'font-normal'
      }
    },
    pageHeader: {
      slots: {
        root: 'border-b-0',
        headline: 'hidden',
        title: 'text-3xl sm:text-4xl font-medium tracking-tight',
        description: 'text-base text-toned'
      }
    },
    pageSection: {
      slots: {
        title: 'font-medium tracking-tight'
      }
    },
    pageCard: {
      slots: {
        title: 'font-medium tracking-tight',
        description: 'text-sm text-toned'
      }
    },
    badge: {
      slots: {
        base: 'font-normal'
      }
    }
  }
})
