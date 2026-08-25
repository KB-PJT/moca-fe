const PRELOAD_ERROR_RELOAD_KEY = 'moca-preload-error-reload-at'
const RELOAD_COOLDOWN_MS = 10_000

type PreloadErrorRecoveryOptions = {
  now?: number
  reload?: () => void
  storage?: Storage
}

/**
 * Reloads once when an open tab references a chunk from an older deployment.
 * The cooldown prevents a transient network failure from causing a reload loop.
 */
export function recoverFromPreloadError(
  event: Event,
  {
    now = Date.now(),
    reload = () => window.location.reload(),
    storage = window.sessionStorage,
  }: PreloadErrorRecoveryOptions = {},
) {
  event.preventDefault()

  const lastReloadAt = Number(storage.getItem(PRELOAD_ERROR_RELOAD_KEY))
  const canReload =
    !Number.isFinite(lastReloadAt) ||
    lastReloadAt <= 0 ||
    now < lastReloadAt ||
    now - lastReloadAt >= RELOAD_COOLDOWN_MS

  if (!canReload) return

  storage.setItem(PRELOAD_ERROR_RELOAD_KEY, String(now))
  reload()
}
