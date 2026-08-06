import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      // 로컬 개발 서버에서도 manifest를 제공해 홈 화면 앱의 전체 경로 scope를 유지한다.
      // dev 서버는 정적 빌드 산출물이 없어 precache 대상이 비어있다는 경고가 매번 떠서 꺼둠.
      // PWA 설치 테스트가 필요하면 임시로 true로 바꿔서 확인.
      devOptions: { enabled: false },
      // 새 버전을 바로 적용하지 않고 사용자에게 업데이트 여부를 먼저 확인한다.
      registerType: 'prompt',
      // 서비스 워커는 PwaUpdatePrompt에서 직접 등록한다.
      injectRegister: null,
      // public 디렉터리의 앱 아이콘과 파비콘도 precache에 포함한다.
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'MOCA',
        short_name: 'MOCA',
        description: '내 카드 혜택과 실적을 한눈에 확인하는 서비스',
        lang: 'ko-KR',
        start_url: '/',
        scope: '/',
        // 홈 화면에서 실행할 때 브라우저 주소창 없이 앱처럼 표시한다.
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/moca-app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/moca-app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // 빌드된 화면 코드, 스타일, 이미지, 폰트를 서비스 워커가 미리 캐싱한다.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 앱 내부 주소로 직접 접속하거나 새로고침해도 Vue 앱을 열어 준다.
        navigateFallback: '/index.html',
        // API 요청은 화면 주소가 아니므로 index.html로 대체하지 않는다.
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        // 새 버전 배포 후 더 이상 사용하지 않는 이전 캐시를 정리한다.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
