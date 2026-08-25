import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recoverFromPreloadError } from '@/shared/utils/preloadErrorRecovery'

describe('recoverFromPreloadError', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('reloads after the first failed dynamic import', () => {
    const event = new Event('vite:preloadError', { cancelable: true })
    const reload = vi.fn<() => void>()

    recoverFromPreloadError(event, { now: 1_000, reload, storage: sessionStorage })

    expect(event.defaultPrevented).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('does not reload again during the cooldown', () => {
    const reload = vi.fn<() => void>()
    const firstEvent = new Event('vite:preloadError', { cancelable: true })
    const secondEvent = new Event('vite:preloadError', { cancelable: true })

    recoverFromPreloadError(firstEvent, { now: 1_000, reload, storage: sessionStorage })
    recoverFromPreloadError(secondEvent, { now: 2_000, reload, storage: sessionStorage })

    expect(secondEvent.defaultPrevented).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('allows recovery again after the cooldown', () => {
    const reload = vi.fn<() => void>()
    const firstEvent = new Event('vite:preloadError', { cancelable: true })
    const laterEvent = new Event('vite:preloadError', { cancelable: true })

    recoverFromPreloadError(firstEvent, { now: 1_000, reload, storage: sessionStorage })
    recoverFromPreloadError(laterEvent, { now: 11_000, reload, storage: sessionStorage })

    expect(laterEvent.defaultPrevented).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})
