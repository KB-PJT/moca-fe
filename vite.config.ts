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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'firebase-messaging-sw.ts',
      // localhost 개발 서버에서도 FCM 서비스 워커와 푸시 수신을 검증한다.
      devOptions: { enabled: true, type: 'module' },
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
})
