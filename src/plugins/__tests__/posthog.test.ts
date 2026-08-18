import { beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMocks = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: {
    init: posthogMocks.init,
    capture: posthogMocks.capture,
  },
}))

describe('shouldInitPostHog', () => {
  it('키가 있으면 true를 반환한다', async () => {
    const { shouldInitPostHog } = await import('@/plugins/posthog')
    expect(shouldInitPostHog('phc_abc')).toBe(true)
  })

  it('키가 없거나 공백뿐이면 false를 반환한다', async () => {
    const { shouldInitPostHog } = await import('@/plugins/posthog')
    expect(shouldInitPostHog('')).toBe(false)
    expect(shouldInitPostHog(undefined)).toBe(false)
    expect(shouldInitPostHog('   ')).toBe(false)
  })
})

describe('initPostHog / capturePageview', () => {
  beforeEach(() => {
    vi.resetModules()
    posthogMocks.init.mockReset()
    posthogMocks.capture.mockReset()
  })

  it('키가 없으면 초기화하지 않고 이후 pageview도 보내지 않는다', async () => {
    const { initPostHog, capturePageview } = await import('@/plugins/posthog')

    initPostHog('', 'https://us.i.posthog.com')
    capturePageview('/home')

    expect(posthogMocks.init).not.toHaveBeenCalled()
    expect(posthogMocks.capture).not.toHaveBeenCalled()
  })

  it('키가 있으면 초기화하고 이후 pageview를 보낸다', async () => {
    const { initPostHog, capturePageview } = await import('@/plugins/posthog')

    initPostHog('phc_abc', 'https://us.i.posthog.com')
    capturePageview('/home')

    expect(posthogMocks.init).toHaveBeenCalledWith(
      'phc_abc',
      expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        capture_pageview: false,
        autocapture: false,
        person_profiles: 'identified_only',
      }),
    )
    expect(posthogMocks.capture).toHaveBeenCalledWith('$pageview', { $current_url: '/home' })
  })

  it('api_host를 생략하면 기본 US Cloud 주소를 사용한다', async () => {
    const { initPostHog } = await import('@/plugins/posthog')

    initPostHog('phc_abc')

    expect(posthogMocks.init).toHaveBeenCalledWith(
      'phc_abc',
      expect.objectContaining({ api_host: 'https://us.i.posthog.com' }),
    )
  })
})
