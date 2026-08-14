<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'

interface Props {
  nickname: string
  missedBenefitAmount: number
  isLoading?: boolean
  error?: string
}

defineProps<Props>()

const emit = defineEmits<{
  retry: []
}>()

const currencyFormatter = new Intl.NumberFormat('ko-KR')
</script>

<template>
  <section class="-mt-3 px-5 pb-4" aria-label="이번 달 놓치고 있는 혜택">
    <div v-if="isLoading" class="space-y-2 py-1" aria-label="홈 혜택 정보 로딩 중">
      <div class="h-5 w-32 animate-pulse rounded-sm bg-primary/10" />
      <div class="h-6 w-64 animate-pulse rounded-sm bg-primary/10" />
    </div>
    <div v-else-if="error" class="flex items-center justify-between gap-3 py-1">
      <p role="alert" class="text-caption text-error">{{ error }}</p>
      <button
        type="button"
        class="shrink-0 text-caption font-semibold text-brown"
        @click="emit('retry')"
      >
        다시 시도
      </button>
    </div>

    <template v-else>
      <p class="text-body text-[#8C7F74]">안녕하세요, {{ nickname }}님</p>

      <div class="mt-0.5 flex items-center justify-between gap-2">
        <p class="min-w-0 truncate text-subheading font-semibold text-charcoal">
          <span aria-hidden="true">🚨</span>이번 달 혜택
          <strong class="font-semibold text-primary"
            >{{ currencyFormatter.format(missedBenefitAmount) }}원</strong
          >을 놓치고 있어요!
        </p>
        <RouterLink
          :to="{ name: 'report' }"
          class="flex shrink-0 items-center gap-0.5 text-caption font-semibold text-brown"
        >
          보러가기
          <ChevronRight class="size-3" aria-hidden="true" />
        </RouterLink>
      </div>
    </template>
  </section>
</template>
