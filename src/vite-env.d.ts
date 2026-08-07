/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string
  readonly VITE_KAKAO_MAP_KEY: string
  readonly VITE_LOCAL_TEST_ACCESS_TOKEN?: string
  readonly VITE_POSTHOG_KEY: string
  readonly VITE_POSTHOG_HOST: string
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  // 카카오맵 SDK 타입 정의가 따로 없어서 any로 선언한다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kakao: any
}
