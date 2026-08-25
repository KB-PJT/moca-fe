import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { queryClient } from '@/plugins/vue-query'
import { initPostHog } from '@/plugins/posthog'
import { recoverFromPreloadError } from '@/shared/utils/preloadErrorRecovery'

window.addEventListener('vite:preloadError', recoverFromPreloadError)

initPostHog(import.meta.env.VITE_POSTHOG_KEY, import.meta.env.VITE_POSTHOG_HOST)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
