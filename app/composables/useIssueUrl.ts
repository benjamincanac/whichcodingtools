/**
 * A prefilled link to one of the two GitHub issue forms. The template has to be named:
 * each form applies the label the agent's responders gate on, and a blank issue carries
 * none of them, so it reaches the Friday triage and nothing else.
 */
export function useIssueUrl() {
  const { site } = useAppConfig()
  return (template: 'tool' | 'outdated', fields: Record<string, string> = {}) => {
    const params = new URLSearchParams({ template: `${template}.yml`, ...fields })
    return `https://github.com/${site.repo}/issues/new?${params}`
  }
}
