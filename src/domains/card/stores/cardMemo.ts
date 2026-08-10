import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_CARD_MEMOS } from '@/domains/card/mocks/cardMemos'

const CARD_MEMO_STORAGE_KEY = 'moca-card-memos'

function readStoredMemos() {
  if (typeof window === 'undefined') return {}

  try {
    const storedMemos = window.localStorage.getItem(CARD_MEMO_STORAGE_KEY)
    return storedMemos ? (JSON.parse(storedMemos) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export const useCardMemoStore = defineStore('cardMemo', () => {
  const memos = ref<Record<string, string>>({
    ...DEFAULT_CARD_MEMOS,
    ...readStoredMemos(),
  })

  function getMemo(cardId: string) {
    return memos.value[cardId] ?? ''
  }

  function hasMemo(cardId: string) {
    return Object.prototype.hasOwnProperty.call(memos.value, cardId)
  }

  function setMemo(cardId: string, memo: string) {
    memos.value = {
      ...memos.value,
      [cardId]: memo.trim(),
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CARD_MEMO_STORAGE_KEY, JSON.stringify(memos.value))
      } catch {
        // 저장소를 사용할 수 없어도 현재 화면의 메모 수정은 유지한다.
      }
    }
  }

  return { memos, getMemo, hasMemo, setMemo }
})
