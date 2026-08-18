import posthog from 'posthog-js'

const DEFAULT_API_HOST = 'https://us.i.posthog.com'

let isInitialized = false

// 키를 아직 안 넣었으면(빈 문자열) 조용히 비활성 상태로 둔다.
export function shouldInitPostHog(apiKey?: string): boolean {
  return Boolean(apiKey?.trim())
}

export function initPostHog(apiKey?: string, apiHost?: string): void {
  if (!shouldInitPostHog(apiKey)) return

  posthog.init(apiKey!.trim(), {
    api_host: apiHost?.trim() || DEFAULT_API_HOST,
    // SDK가 버전에 따라 기본 동작을 바꿔도 이 스냅샷 기준 동작을 유지한다.
    defaults: '2026-05-30',
    // 라우터 afterEach에서 SPA 네비게이션마다 직접 pageview를 보내므로 자동 캡처는 끈다.
    capture_pageview: false,
    // 카드/결제 화면 클릭·입력을 의도치 않게 수집하지 않도록 자동 캡처는 끄고 필요한 이벤트만 명시적으로 보낸다.
    autocapture: false,
    // identify() 호출 전까지는 익명 이벤트로만 수집하고 개인 프로필을 만들지 않는다.
    person_profiles: 'identified_only',
  })
  isInitialized = true
}

export function capturePageview(path: string): void {
  if (!isInitialized) return
  posthog.capture('$pageview', { $current_url: path })
}
