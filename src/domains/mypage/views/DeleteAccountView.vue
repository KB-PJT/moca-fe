<script setup lang="ts">
import { CircleX, TriangleAlert } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { deleteMocaAccount } from '@/domains/mypage/api/mypage'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import { Checkbox } from '@/shared/ui/checkbox'

const DELETE_ACCOUNT_REASONS = [
  '서비스 사용이 불편해요',
  '필요한 기능이 없어요',
  '혜택 정보가 정확하지 않아요',
  '개인정보가 걱정돼요',
  '사용 빈도가 낮아요',
  '기타',
] as const

const DELETED_INFORMATION = [
  'MOCA 계정',
  '등록한 카드 정보',
  '카드 승인내역',
  '실적 및 혜택 분석 데이터',
  '알림 및 서비스 설정',
  '카드 데이터 연결 정보',
] as const

const router = useRouter()
const authStore = useAuthStore()
const selectedReason = ref<string>()
const hasAgreed = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const isAccountDeleted = ref(false)
const loginHref = router.resolve({ name: 'login' }).href

const isSubmitDisabled = computed(() => !hasAgreed.value || isSubmitting.value)

function toggleReason(reason: string) {
  selectedReason.value = selectedReason.value === reason ? undefined : reason
}

async function submitDeleteAccount() {
  if (isSubmitDisabled.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    await deleteMocaAccount(selectedReason.value)
  } catch {
    submitError.value = '회원 탈퇴를 완료하지 못했어요. 잠시 후 다시 시도해주세요.'
    isSubmitting.value = false
    return
  }

  authStore.clearSession()
  isAccountDeleted.value = true

  try {
    await router.replace({ name: 'login' })
  } catch {
    // 라우터 이동에 실패하더라도 탈퇴는 이미 완료되었으므로 복구 링크를 유지한다.
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PageLayout title="회원 탈퇴" :horizontal-padding="false">
    <form
      v-if="!isAccountDeleted"
      id="delete-account-form"
      class="px-5"
      @submit.prevent="submitDeleteAccount"
    >
      <section
        aria-labelledby="deleted-information-title"
        class="rounded-lg bg-error/7 px-5 py-5 text-error"
      >
        <h2 id="deleted-information-title" class="flex items-center gap-2 text-body font-bold">
          <TriangleAlert class="size-5 shrink-0" aria-hidden="true" />
          탈퇴 시 삭제되는 정보
        </h2>

        <ul class="mt-3.5 space-y-2.5 text-body">
          <li v-for="item in DELETED_INFORMATION" :key="item" class="flex items-center gap-2">
            <CircleX class="size-4 shrink-0" aria-hidden="true" />
            <span>{{ item }}</span>
          </li>
        </ul>

        <p class="mt-4 border-t border-error/20 pt-3 text-caption font-bold">
          삭제된 정보는 복구할 수 없어요.
        </p>
      </section>

      <fieldset class="mt-6">
        <legend class="mb-3 text-subheading font-bold text-charcoal">탈퇴 사유 (선택)</legend>
        <div class="overflow-hidden rounded-lg border border-divider/60 bg-card shadow-card">
          <button
            v-for="reason in DELETE_ACCOUNT_REASONS"
            :key="reason"
            type="button"
            :aria-pressed="selectedReason === reason"
            class="flex min-h-14 w-full cursor-pointer items-center gap-3 border-b border-divider/70 px-5 text-left last:border-b-0"
            @click="toggleReason(reason)"
          >
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
              :class="selectedReason === reason ? 'border-primary' : 'border-disabled'"
              aria-hidden="true"
            >
              <span
                class="size-2.5 rounded-full bg-primary"
                :class="selectedReason === reason ? 'opacity-100' : 'opacity-0'"
              />
            </span>
            <span class="text-body font-semibold text-charcoal">{{ reason }}</span>
          </button>
        </div>
      </fieldset>

      <label class="mt-5 flex cursor-pointer items-start gap-3">
        <Checkbox v-model="hasAgreed" class="mt-0.5 size-5 rounded-xs" />
        <span class="text-body font-semibold text-charcoal">
          안내 사항을 모두 확인했으며, 탈퇴 시 모든 데이터가 삭제되어 복구할 수 없음을 동의해요.
        </span>
      </label>

      <p v-if="submitError" role="alert" class="mt-3 text-caption text-error">
        {{ submitError }}
      </p>
    </form>

    <section v-else role="status" class="flex h-full flex-col items-center justify-center px-5">
      <h2 class="text-heading text-charcoal">회원 탈퇴가 완료되었어요.</h2>
      <p class="mt-2 text-center text-body text-gray">
        로그인 화면으로 자동 이동하지 않았다면<br />아래 버튼을 눌러주세요.
      </p>
    </section>

    <template #footer>
      <MocaButton
        v-if="!isAccountDeleted"
        form="delete-account-form"
        type="submit"
        block
        :disabled="isSubmitDisabled"
        :loading="isSubmitting"
        class="h-13 rounded-md font-bold"
      >
        {{ isSubmitting ? '탈퇴 처리 중...' : '회원 탈퇴하기' }}
      </MocaButton>
      <a
        v-else
        :href="loginHref"
        class="flex h-13 w-full items-center justify-center rounded-md bg-primary font-bold text-primary-foreground hover:bg-primary-hover"
      >
        로그인 화면으로 이동
      </a>
    </template>
  </PageLayout>
</template>
