import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// 전체 CSS 번들이 <head>에서 렌더링을 막지 않도록, media="print" 스왑 기법으로 비동기 로드한다.
// index.html에 정적으로 넣어둔 초기 로딩 화면이 CSS를 기다리지 않고 즉시 페인트되게 하기 위함이다.
function deferStylesheetsPlugin(): Plugin {
  return {
    name: 'defer-stylesheets',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*)>/g,
        (_match, before: string, href: string, after: string) =>
          `<link rel="stylesheet"${before}href="${href}"${after} media="print" onload="this.media='all'">` +
          `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    deferStylesheetsPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'firebase-messaging-sw.ts',
      // localhost 개발 서버에서도 FCM 서비스 워커와 푸시 수신을 검증한다.
      devOptions: { enabled: true, type: 'module' },
      // 새 버전을 바로 적용하지 않고 사용자에게 업데이트 여부를 먼저 확인한다.
      registerType: 'prompt',
      // 서비스 워커는 PwaUpdatePrompt에서 직접 등록한다.
      injectRegister: false,
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
      injectManifest: {
        // 커스텀 서비스 워커 안에 PWA precache 목록을 주입한다.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 지원 브라우저를 최신 기준으로 명시해, 우리 코드에 불필요한 legacy 폴리필이
  // 섞여 들어가지 않게 한다(서드파티 라이브러리 자체의 legacy 코드는 대상 밖).
  build: {
    target: 'es2022',
  },
  // 배포 환경에선 vercel.json의 rewrite가 /api를 실제 백엔드로 프록시해주지만,
  // vite preview는 정적 파일만 서빙하므로 로컬 프로덕션 빌드 테스트용으로 동일하게 흉내낸다.
  preview: {
    proxy: {
      '/api': {
        target: 'https://api.mocabe.store',
        changeOrigin: true,
      },
    },
  },
})
