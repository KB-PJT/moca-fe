import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { restoreInitialMocaSession } from '@/shared/api/client'
import { queryClient } from '@/plugins/vue-query'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')

// access token은 메모리에만 있으므로, 새로고침 후 HttpOnly refresh cookie로 복구한다.
void restoreInitialMocaSession()
