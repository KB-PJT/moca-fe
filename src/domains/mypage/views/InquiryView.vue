<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
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

const authStore = useAuthStore()
const router = useRouter()
const selectedCategory = ref<InquiryCategory | null>(null)
const title = ref('')
const content = ref('')
const email = ref(authStore.user?.email ?? '')

const isSubmitDisabled = computed(
  () =>
    !selectedCategory.value || !title.value.trim() || !content.value.trim() || !email.value.trim(),
)

function selectCategory(category: InquiryCategory) {
  selectedCategory.value = category
}

function submitInquiry() {
  if (isSubmitDisabled.value) return
  void router.push({
    name: 'mypage',
    state: { inquirySubmitted: true },
  })
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

    <template #footer>
      <MocaButton
        form="inquiry-form"
        type="submit"
        block
        :disabled="isSubmitDisabled"
        class="h-13 rounded-md font-bold disabled:bg-primary! disabled:opacity-35!"
      >
        문의 보내기
      </MocaButton>
    </template>
  </PageLayout>
</template>
