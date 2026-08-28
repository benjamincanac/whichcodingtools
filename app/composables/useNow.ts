/**
 * Request-time anchor for relative dates. Shared through the payload so the
 * server and the hydrating client compute the same label, no ClientOnly needed.
 */
export function useNow() {
  const now = useState('now', () => new Date().toISOString())
  return computed(() => new Date(now.value))
}
