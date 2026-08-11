<script setup lang="ts">
import axios from 'axios'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import {
  createInquiry,
  type InquiryErrorApiResponse,
  type InquiryType,
} from '@/domains/mypage/api/inquiry'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

const inquiryCategories = [
  '카드 연동',
  '실적·혜택 정보',
  '지도·가맹점',
  '계정·로그인',
  '오류 신고',
  '기타',
] as const

type InquiryCategory = (typeof inquiryCategories)[number]

const inquiryTypeMap: Record<InquiryCategory, InquiryType> = {
  '카드 연동': 'card_link',
  '실적·혜택 정보': 'performance_benefit',
  '지도·가맹점': 'map_merchant',
  '계정·로그인': 'account_login',
  '오류 신고': 'bug',
  기타: 'etc',
}

const authStore = useAuthStore()
const router = useRouter()
const selectedCategory = ref<InquiryCategory | null>(null)
const title = ref('')
const content = ref('')
const email = ref(authStore.user?.email ?? '')
const isSubmitting = ref(false)
const submitError = ref('')

const normalizedTitle = computed(() => title.value.trim())
const normalizedContent = computed(() => content.value.trim())
const normalizedEmail = computed(() => email.value.trim())
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))

const isSubmitDisabled = computed(
  () =>
    isSubmitting.value ||
    !selectedCategory.value ||
    !normalizedTitle.value ||
    normalizedTitle.value.length > 100 ||
    !normalizedContent.value ||
    normalizedContent.value.length > 2000 ||
    !isEmailValid.value,
)

function selectCategory(category: InquiryCategory) {
  selectedCategory.value = category
}

async function submitInquiry() {
  if (isSubmitDisabled.value || !selectedCategory.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    await createInquiry({
      inquiryType: inquiryTypeMap[selectedCategory.value],
      title: normalizedTitle.value,
      content: normalizedContent.value,
      replyEmail: normalizedEmail.value,
    })

    await router.push({
      name: 'mypage',
      state: { inquirySubmitted: true },
    })
  } catch (error) {
    if (axios.isAxiosError<InquiryErrorApiResponse>(error)) {
      const errorCode = error.response?.data?.error?.code

      if (errorCode === 'VALIDATION_FAILED') {
        submitError.value = '입력한 내용을 다시 확인해주세요.'
        return
      }

      if (errorCode === 'AUTHENTICATION_REQUIRED') {
        submitError.value = '로그인이 필요합니다. 다시 로그인해주세요.'
        return
      }
    }

    submitError.value = '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PageLayout title="문의하기" has-bottom-bar>
    <form id="inquiry-form" class="-mt-1" @submit.prevent="submitInquiry">
      <fieldset>
        <legend class="text-caption mb-2 font-bold text-[#8C7F74]">
          문의 유형 <span class="text-error" aria-hidden="true">*</span>
        </legend>
        <div class="flex flex-wrap gap-2" aria-label="문의 유형">
          <button
            v-for="category in inquiryCategories"
            :key="category"
            type="button"
            class="text-caption rounded-full px-3.5 py-1.5 font-bold transition-colors"
            :class="
              selectedCategory === category ? 'bg-primary text-white' : 'bg-divider text-[#8C7F74]'
            "
            :aria-pressed="selectedCategory === category"
            @click="selectCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </fieldset>

      <div class="mt-5">
        <label for="inquiry-title" class="text-caption mb-2 block font-bold text-[#8C7F74]">
          제목 <span class="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="inquiry-title"
          v-model="title"
          name="title"
          type="text"
          required
          maxlength="100"
          class="text-body h-12.5 w-full rounded-md border border-black/8 bg-card px-4 text-charcoal outline-none placeholder:text-charcoal/50 focus:border-primary focus:ring-3 focus:ring-primary/15"
          placeholder="문의 제목을 입력해주세요"
        />
      </div>

      <div class="mt-5">
        <label for="inquiry-content" class="text-caption mb-2 block font-bold text-[#8C7F74]">
          문의 내용 <span class="text-error" aria-hidden="true">*</span>
        </label>
        <textarea
          id="inquiry-content"
          v-model="content"
          name="content"
          required
          maxlength="2000"
          class="text-body h-32.5 w-full resize-none rounded-md border border-black/8 bg-card px-4 py-3.5 text-charcoal outline-none placeholder:text-charcoal/50 focus:border-primary focus:ring-3 focus:ring-primary/15"
          placeholder="문의 내용을 자세히 입력해주세요"
        />
      </div>

      <div class="mt-5">
        <label for="inquiry-email" class="text-caption mb-2 block font-bold text-[#8C7F74]">
          답변받을 이메일 <span class="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="inquiry-email"
          v-model="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          class="text-body h-12.5 w-full rounded-md border border-black/8 bg-card px-4 text-charcoal outline-none placeholder:text-charcoal/50 focus:border-primary focus:ring-3 focus:ring-primary/15"
          placeholder="이메일을 입력해주세요"
        />
      </div>
    </form>

    <p v-if="submitError" role="alert" class="mt-3 text-caption text-error">
      {{ submitError }}
    </p>

    <template #footer>
      <MocaButton
        form="inquiry-form"
        type="submit"
        block
        :disabled="isSubmitDisabled"
        class="h-13 rounded-md font-bold disabled:bg-primary! disabled:opacity-35!"
      >
        {{ isSubmitting ? '접수 중...' : '문의 보내기' }}
      </MocaButton>
    </template>
  </PageLayout>
</template>
