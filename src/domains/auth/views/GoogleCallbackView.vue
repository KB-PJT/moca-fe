<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginToMoca } from '@/domains/auth/api/auth'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { clearGoogleLoginSession, getGoogleCodeVerifier } from '@/domains/auth/utils/pkce'

const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref('')

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')
    const savedState = sessionStorage.getItem('google_oauth_state')

    if (oauthError) {
      throw new Error('Google 로그인이 취소되었습니다.')
    }

    if (!code || !state || state !== savedState) {
      throw new Error('OAuth state 검증에 실패했습니다.')
    }

    const codeVerifier = getGoogleCodeVerifier()

    if (!codeVerifier) {
      throw new Error('PKCE code_verifier가 없습니다.')
    }

    const result = await loginToMoca(code, codeVerifier)

    authStore.setAccessToken(result.data.accessToken)
    clearGoogleLoginSession()

    const savedRedirect = sessionStorage.getItem('post_login_redirect')
    sessionStorage.removeItem('post_login_redirect')
    const redirectPath =
      savedRedirect?.startsWith('/') && !savedRedirect.startsWith('//') ? savedRedirect : '/home'

    await router.replace(redirectPath)
  } catch (error) {
    clearGoogleLoginSession()
    errorMessage.value = error instanceof Error ? error.message : '로그인에 실패했습니다.'

    window.setTimeout(() => {
      void router.replace({ name: 'login' })
    }, 1500)
  }
})
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-white px-5">
    <p class="text-center text-body text-gray">
      {{ errorMessage || '로그인 처리 중입니다...' }}
    </p>
  </main>
</template>
