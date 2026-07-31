import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface AccountProfile {
  name: string
}

const ACCOUNT_STORAGE_KEY = 'account'

export const useAccountStore = defineStore('account', () => {
  const profile = ref<AccountProfile | null>(null)

  const displayName = computed(() => profile.value?.name.trim() || '고객')

  // TODO(API): 로그인 사용자 프로필 조회 응답으로 profile을 채우고 localStorage 의존을 제거한다.
  function hydrate() {
    if (typeof window === 'undefined') return

    const storedAccount = window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
    if (!storedAccount) return

    try {
      const parsedAccount = JSON.parse(storedAccount) as Partial<AccountProfile>
      if (typeof parsedAccount.name === 'string') {
        profile.value = { name: parsedAccount.name }
      }
    } catch {
      profile.value = null
    }
  }

  hydrate()

  return {
    profile,
    displayName,
    hydrate,
  }
})
