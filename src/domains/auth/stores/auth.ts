import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuthUser {
  nickname: string
  email: string
  provider: 'google'
}

const MOCK_AUTH_USER: AuthUser = {
  nickname: '지민',
  email: 'jimin@gmail.com',
  provider: 'google',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(MOCK_AUTH_USER)

  function clearSession() {
    user.value = null
  }

  function updateNickname(nickname: string) {
    if (!user.value) return
    user.value = { ...user.value, nickname }
  }

  return {
    user,
    clearSession,
    updateNickname,
  }
})
