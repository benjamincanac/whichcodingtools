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
    badge: {
      slots: {
        base: 'font-normal'
      }
    },
    checkbox: {
      variants: {
        variant: {
          card: {
            root: 'border-default'
          }
        }
      }
    },
    checkboxGroup: {
      variants: {
        variant: {
          table: {
            item: 'border-default'
          }
        }
      }
    },
    selectMenu: {
      slots: {
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-100'
      },
      variants: {
        variant: {
          filter: 'ring ring-inset ring-default hover:ring-accented hover:bg-elevated/50 transition data-[state=open]:ring-accented data-[state=open]:bg-elevated/50 outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
        }
      }
    },
    navigationMenu: {
      slots: {
        link: 'font-normal'
      }
    },
    pageHeader: {
      slots: {
        root: 'border-b-0 pb-0',
        title: 'text-3xl sm:text-4xl font-medium tracking-tight',
        description: 'text-base text-toned max-w-4xl text-pretty'
      }
    },
    pageCard: {
      slots: {
        title: 'font-medium tracking-tight',
        description: 'text-sm text-toned'
      }
    }
  }
})
