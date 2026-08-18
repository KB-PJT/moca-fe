<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleDollarSign, Coins, Plane, Sparkles, type LucideIcon } from '@lucide/vue'
import {
  fetchBenefitPreference,
  updateBenefitPreference,
  type BenefitPreferenceType,
} from '@/domains/auth/api/auth'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

interface OnboardingStep {
  title: string
  description: string
}

interface PreferenceOption {
  value: BenefitPreferenceType
  title: string
  description: string
  icon: LucideIcon
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: '내 카드를 한눈에',
    description: '보유한 모든 카드의 실적과 혜택을\n한 화면에서 확인하세요',
  },
  {
    title: '결제 전 혜택 확인',
    description: '주변 가맹점에서 어떤 카드로 결제하면\n가장 유리한지 바로 알려드려요',
  },
  {
    title: '혜택 리포트 분석',
    description: '월별 카드 실적과 혜택 달성률을\n한눈에 파악하고 관리하세요',
  },
  {
    title: '어떤 혜택을 우선으로 볼까요?',
    description: '선호하는 혜택을 알려주시면\n나에게 더 유리한 카드를 먼저 추천해 드려요',
  },
]

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    value: 'IMMEDIATE_SAVINGS',
    title: '바로 할인받기',
    description: '결제할 때 바로 할인이나 캐시백을 받고 싶어요',
    icon: CircleDollarSign,
  },
  {
    value: 'POINT_USAGE',
    title: '포인트 모으기',
    description: '쓸 수 있는 포인트를 차곡차곡 모으고 싶어요',
    icon: Coins,
  },
  {
    value: 'TRAVEL_MILEAGE',
    title: '마일리지 쌓기',
    description: '여행에 사용할 항공 마일리지를 쌓고 싶어요',
    icon: Plane,
  },
  {
    value: 'MAXIMUM_BENEFIT',
    title: '혜택 금액 최대로',
    description: '종류보다 가장 큰 금액의 혜택이 중요해요',
    icon: Sparkles,
  },
]

const router = useRouter()
const currentStepIndex = ref(0)
const selectedPreference = ref<BenefitPreferenceType | null>(null)
const isSubmitting = ref(false)
const submitError = ref('')
const slideDirection = ref<'forward' | 'backward'>('forward')
const pointerStartX = ref<number | null>(null)
const hasPreferenceInteraction = ref(false)

const currentStep = computed(() => ONBOARDING_STEPS[currentStepIndex.value] ?? ONBOARDING_STEPS[0]!)
const isLastStep = computed(() => currentStepIndex.value === ONBOARDING_STEPS.length - 1)
const slideTransitionName = computed(() =>
  slideDirection.value === 'forward' ? 'slide-forward' : 'slide-backward',
)

function goToHome() {
  void router.push({ name: 'home' })
}

function handleSkip() {
  moveToStep(ONBOARDING_STEPS.length - 1)
}

function togglePreference(preference: BenefitPreferenceType) {
  hasPreferenceInteraction.value = true
  selectedPreference.value = selectedPreference.value === preference ? null : preference
}

onMounted(async () => {
  try {
    const savedPreference = await fetchBenefitPreference()
    if (!hasPreferenceInteraction.value) selectedPreference.value = savedPreference
  } catch {
    // 조회에 실패해도 온보딩 선택 및 저장은 계속 진행할 수 있다.
  }
})

function moveToStep(index: number) {
  if (index < 0 || index >= ONBOARDING_STEPS.length || index === currentStepIndex.value) return

  slideDirection.value = index > currentStepIndex.value ? 'forward' : 'backward'
  currentStepIndex.value = index
}

function handlePointerDown(event: PointerEvent) {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
  if (event.target instanceof Element && event.target.closest('button')) return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  pointerStartX.value = event.clientX
}

function handlePointerUp(event: PointerEvent) {
  const startX = pointerStartX.value
  pointerStartX.value = null
  releasePointerCapture(event)

  if (startX === null || Math.abs(startX - event.clientX) < 50) return

  moveToStep(currentStepIndex.value + (startX > event.clientX ? 1 : -1))
}

function handlePointerCancel(event: PointerEvent) {
  pointerStartX.value = null
  releasePointerCapture(event)
}

function releasePointerCapture(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

async function handleNext() {
  if (isLastStep.value) {
    if (!selectedPreference.value || isSubmitting.value) return

    isSubmitting.value = true
    submitError.value = ''

    try {
      await updateBenefitPreference(selectedPreference.value)
    } catch {
      submitError.value = '선호 혜택을 저장하지 못했어요. 다시 시도해 주세요.'
      isSubmitting.value = false
      return
    }

    goToHome()
    return
  }

  moveToStep(currentStepIndex.value + 1)
}
</script>

<template>
  <PageLayout hide-app-bar>
    <div class="flex min-h-160 flex-col">
      <div class="flex justify-end">
        <button
          v-if="!isLastStep"
          type="button"
          class="text-body font-medium text-gray hover:text-charcoal"
          @click="handleSkip"
        >
          건너뛰기
        </button>
      </div>

      <section
        class="flex flex-1 touch-pan-y overflow-hidden text-center"
        aria-live="polite"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerCancel"
      >
        <Transition :name="slideTransitionName" mode="out-in">
          <div
            :key="currentStepIndex"
            class="flex w-full flex-1 flex-col items-center justify-center"
          >
            <div v-if="!isLastStep" class="h-100 w-49 rounded-md bg-screen" aria-hidden="true" />

            <h1 :class="isLastStep ? 'text-heading' : 'mt-8 text-subheading'" class="text-charcoal">
              {{ currentStep.title }}
            </h1>
            <p class="mt-3 whitespace-pre-line text-body text-gray">
              {{ currentStep.description }}
            </p>

            <fieldset v-if="isLastStep" class="mt-7 flex w-full flex-col gap-2.5 text-left">
              <legend class="sr-only">선호 혜택 선택</legend>
              <button
                v-for="option in PREFERENCE_OPTIONS"
                :key="option.value"
                type="button"
                :aria-pressed="selectedPreference === option.value"
                class="relative flex items-center justify-center rounded-md border px-14 py-3 text-center transition-colors"
                :class="
                  selectedPreference === option.value
                    ? 'border-primary bg-accent'
                    : 'border-divider bg-card hover:border-primary/40'
                "
                @click="togglePreference(option.value)"
              >
                <span
                  class="absolute left-4 flex size-9 items-center justify-center rounded-full"
                  :class="
                    selectedPreference === option.value
                      ? 'bg-primary text-white'
                      : 'bg-screen text-brown'
                  "
                >
                  <component :is="option.icon" class="size-5" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span class="block text-body font-semibold text-charcoal">{{
                    option.title
                  }}</span>
                  <span class="mt-0.5 block text-caption break-keep text-gray">
                    {{ option.description }}
                  </span>
                </span>
              </button>
            </fieldset>

            <p v-if="submitError" class="mt-3 text-caption text-error" role="alert">
              {{ submitError }}
            </p>
          </div>
        </Transition>
      </section>

      <div
        v-if="!isLastStep"
        class="flex items-center justify-center gap-2 pb-4"
        aria-label="온보딩 진행 상태"
      >
        <button
          v-for="(_, index) in ONBOARDING_STEPS.slice(0, -1)"
          :key="index"
          type="button"
          :aria-label="`${index + 1}번째 화면으로 이동`"
          :aria-current="currentStepIndex === index ? 'step' : undefined"
          class="h-2 rounded-full transition-all"
          :class="currentStepIndex === index ? 'w-7 bg-primary' : 'w-2 bg-disabled'"
          @click="moveToStep(index)"
        />
      </div>
    </div>

    <template #footer>
      <MocaButton
        block
        class="h-13 rounded-md text-subheading"
        :disabled="isLastStep && !selectedPreference"
        :loading="isSubmitting"
        @click="handleNext"
      >
        {{ isLastStep ? '선택하고 시작하기' : '다음' }}
      </MocaButton>
    </template>
  </PageLayout>
</template>

<style scoped>
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-backward-enter-active,
.slide-backward-leave-active {
  transition:
    transform 240ms ease,
    opacity 240ms ease;
}

.slide-forward-enter-from,
.slide-backward-leave-to {
  transform: translateX(36px);
  opacity: 0;
}

.slide-forward-leave-to,
.slide-backward-enter-from {
  transform: translateX(-36px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .slide-forward-enter-active,
  .slide-forward-leave-active,
  .slide-backward-enter-active,
  .slide-backward-leave-active {
    transition: none;
  }
}
</style>
