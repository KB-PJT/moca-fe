<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

interface OnboardingStep {
  title: string
  description: string
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
]

const router = useRouter()
const currentStepIndex = ref(0)

const currentStep = computed(() => ONBOARDING_STEPS[currentStepIndex.value] ?? ONBOARDING_STEPS[0]!)
const isLastStep = computed(() => currentStepIndex.value === ONBOARDING_STEPS.length - 1)

function goToHome() {
  void router.push({ name: 'home' })
}

function handleNext() {
  if (isLastStep.value) {
    goToHome()
    return
  }

  currentStepIndex.value += 1
}
</script>

<template>
  <PageLayout hide-app-bar>
    <div class="flex min-h-160 flex-col">
      <div class="flex justify-end">
        <button
          type="button"
          class="text-body font-medium text-gray hover:text-charcoal"
          @click="goToHome"
        >
          건너뛰기
        </button>
      </div>

      <section class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="h-100 w-49 rounded-md bg-screen" aria-hidden="true" />

        <h1 class="mt-8 text-subheading text-charcoal">{{ currentStep.title }}</h1>
        <p class="mt-3 whitespace-pre-line text-body text-gray">
          {{ currentStep.description }}
        </p>
      </section>

      <div class="flex items-center justify-center gap-2 pb-4" aria-label="온보딩 진행 상태">
        <button
          v-for="(_, index) in ONBOARDING_STEPS"
          :key="index"
          type="button"
          :aria-label="`${index + 1}번째 화면으로 이동`"
          :aria-current="currentStepIndex === index ? 'step' : undefined"
          class="h-2 rounded-full transition-all"
          :class="currentStepIndex === index ? 'w-7 bg-primary' : 'w-2 bg-disabled'"
          @click="currentStepIndex = index"
        />
      </div>
    </div>

    <template #footer>
      <MocaButton block class="h-13 rounded-md text-subheading" @click="handleNext">
        {{ isLastStep ? '시작하기' : '다음' }}
      </MocaButton>
    </template>
  </PageLayout>
</template>
