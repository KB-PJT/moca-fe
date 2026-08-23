import type { PostHog } from 'posthog-js'

const DEFAULT_API_HOST = 'https://us.i.posthog.com'

let posthogInstance: PostHog | undefined

// 키를 아직 안 넣었으면(빈 문자열) 조용히 비활성 상태로 둔다.
export function shouldInitPostHog(apiKey?: string): boolean {
  return Boolean(apiKey?.trim())
}

// posthog-js는 초기 렌더 크리티컬 패스에 필요 없으므로, 메인 번들에서 분리해
// 동적으로 불러온다. 로드가 끝나기 전에 발생하는 pageview/이벤트는 조용히 무시된다.
// 호출부(main.ts)는 await 없이 fire-and-forget으로 쓰지만, 테스트에서 로드 완료를
// 기다릴 수 있도록 Promise를 반환한다.
export function initPostHog(apiKey?: string, apiHost?: string): Promise<void> {
  if (!shouldInitPostHog(apiKey)) return Promise.resolve()

  return import('posthog-js').then(({ default: posthog }) => {
    posthog.init(apiKey!.trim(), {
      api_host: apiHost?.trim() || DEFAULT_API_HOST,
      // SDK가 버전에 따라 기본 동작을 바꿔도 이 스냅샷 기준 동작을 유지한다.
      defaults: '2026-05-30',
      // 라우터 afterEach에서 SPA 네비게이션마다 직접 pageview를 보내므로 자동 캡처는 끈다.
      capture_pageview: false,
      // 카드/결제 화면 클릭·입력을 의도치 않게 수집하지 않도록 자동 캡처는 끄고 필요한 이벤트만 명시적으로 보낸다.
      autocapture: false,
      // dead-clicks-autocapture 스크립트가 별도로 로드되어 메인 스레드를 차단했었다.
      // capture_dead_clicks: false만으로는 원격(프로젝트 대시보드) 설정에 따라
      // 여전히 로드될 수 있어서, 세션 리플레이·서베이·dead-clicks 같은 부가 스크립트
      // 자체를 아예 요청하지 않도록 확실하게 막는다. 지금 안 쓰는 기능들이라 안전하다.
      capture_dead_clicks: false,
      disable_external_dependency_loading: true,
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
