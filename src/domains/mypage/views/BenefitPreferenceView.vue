<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchBenefitPreference,
  updateBenefitPreference,
  type BenefitPreferenceType,
} from '@/domains/auth/api/auth'
import {
  BENEFIT_PREFERENCE_OPTIONS,
  getBenefitPreferenceLabel,
} from '@/domains/auth/constants/benefitPreference'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

const router = useRouter()
const queryClient = useQueryClient()

const selectedPreference = ref<BenefitPreferenceType | null>(null)
const hasInteracted = ref(false)

const {
  data: savedPreference,
  isPending,
  isError,
  refetch,
} = useQuery({
  queryKey: ['auth', 'benefit-preference'],
  queryFn: fetchBenefitPreference,
})

watch(
  savedPreference,
  (value) => {
    if (value && !hasInteracted.value) selectedPreference.value = value
  },
  { immediate: true },
)

const {
  mutateAsync: savePreference,
  isPending: isSaving,
  isError: isSaveError,
} = useMutation({
  mutationFn: updateBenefitPreference,
  onSuccess: (_, benefitPreferenceType) => {
    queryClient.setQueryData(['auth', 'benefit-preference'], benefitPreferenceType)
  },
})

const currentPreferenceLabel = computed(() =>
  savedPreference.value ? getBenefitPreferenceLabel(savedPreference.value) : '',
)
const isUnchanged = computed(() => selectedPreference.value === savedPreference.value)
const canSave = computed(
  () => !isPending.value && !isSaving.value && !isUnchanged.value && selectedPreference.value,
)

function selectPreference(preference: BenefitPreferenceType) {
  hasInteracted.value = true
  selectedPreference.value = preference
}

function retry() {
  void refetch()
}

async function handleSave() {
  if (!selectedPreference.value || !canSave.value) return

  try {
    await savePreference(selectedPreference.value)
    void router.back()
  } catch {
    // 오류 메시지는 isSaveError로 노출한다.
  }
}
</script>

<template>
  <PageLayout title="혜택 선호 관리" has-bottom-bar>
    <div class="-mt-2">
      <p v-if="isPending" class="px-1 text-body text-gray">선호 혜택을 불러오는 중이에요</p>
      <p v-else-if="!isError" class="px-1 text-body text-gray">
        현재 <strong class="font-semibold text-charcoal">{{ currentPreferenceLabel }}</strong
        >을(를) 우선으로 카드를 추천하고 있어요<br />
        다른 혜택으로 바꾸면 그에 맞는 카드를 다시 추천해 드려요
      </p>

      <div
        v-if="isError"
        class="mt-4 flex items-center justify-between gap-3 rounded-md bg-error/8 px-4 py-3 text-caption text-error"
      >
        <span>혜택 선호 정보를 불러오지 못했어요.</span>
        <button
          type="button"
          class="shrink-0 font-bold underline underline-offset-2"
          @click="retry"
        >
          다시 시도
        </button>
      </div>

      <fieldset
        class="mt-5 overflow-hidden rounded-lg border border-divider bg-card"
        :disabled="isPending"
      >
        <legend class="sr-only">선호 혜택 선택</legend>
        <button
          v-for="option in BENEFIT_PREFERENCE_OPTIONS"
          :key="option.value"
          type="button"
          :aria-pressed="selectedPreference === option.value"
          class="flex w-full items-center gap-4 border-b border-divider px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-screen"
          @click="selectPreference(option.value)"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full"
            :class="
              selectedPreference === option.value
                ? 'bg-primary text-white'
                : 'bg-screen text-primary'
            "
          >
            <component :is="option.icon" class="size-4" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="block text-body font-semibold text-charcoal">
                {{ option.title }}
              </span>
              <span
                v-if="option.value === savedPreference"
                class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-label font-semibold text-primary"
              >
                현재 선택
              </span>
            </span>
            <span class="mt-1 block text-label font-normal text-gray">
              {{ option.description }}
            </span>
          </span>
        </button>
      </fieldset>
    </div>

    <p v-if="isSaveError" class="mt-3 text-caption text-error" role="alert">
      선호 혜택을 저장하지 못했어요. 다시 시도해 주세요.
    </p>

    <template #footer>
      <MocaButton
        block
        class="h-13 rounded-md text-subheading"
        :disabled="!canSave"
        :loading="isSaving"
        @click="handleSave"
      >
        {{ isUnchanged ? '현재 선택 유지 중' : '이 혜택으로 변경하기' }}
      </MocaButton>
    </template>
  </PageLayout>
</template>
