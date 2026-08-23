import type { PostHog } from 'posthog-js'

const DEFAULT_API_HOST = 'https://us.i.posthog.com'

let posthogInstance: PostHog | undefined

// 키를 아직 안 넣었으면(빈 문자열) 조용히 비활성 상태로 둔다.
export function shouldInitPostHog(apiKey?: string): boolean {
  return Boolean(apiKey?.trim())
}

// posthog-js는 초기 렌더 크리티컬 패스에 필요 없으므로, 메인 번들에서 분리해
// 동적으로 불러온다. 로드가 끝나기 전에 발생하는 pageview/이벤트는 조용히 무시된다.
export function initPostHog(apiKey?: string, apiHost?: string): void {
  if (!shouldInitPostHog(apiKey)) return

  void import('posthog-js').then(({ default: posthog }) => {
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
    posthogInstance = posthog
  })
}

export function capturePageview(path: string): void {
  posthogInstance?.capture('$pageview', { $current_url: path })
}

// 주요 이벤트(가입/카드 연동/추천 확인 등)를 도메인 코드에서 이 함수로 보낸다.
export function captureEvent(name: string, properties?: Record<string, unknown>): void {
  posthogInstance?.capture(name, properties)
}
