<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import BenefitHistoryList from '@/domains/home/components/BenefitHistoryList.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import { Skeleton } from '@/shared/ui/skeleton'

interface Props {
  items: RecentBenefitItem[]
  selectedCardId?: string | null
  isLoading?: boolean
  error?: string
}

const props = defineProps<Props>()
const visibleItems = computed(() =>
  [...props.items]
    .sort((left, right) => parseOccurredAt(right.occurredAt) - parseOccurredAt(left.occurredAt))
    .slice(0, 5),
)

const emit = defineEmits<{
  select: [item: RecentBenefitItem]
  retry: []
}>()

function parseOccurredAt(occurredAt: string) {
  const match = occurredAt.match(/(\d+)월\s+(\d+)일\s+(\d+):(\d+)/)
  if (!match) return 0

  const [, month, day, hour, minute] = match.map(Number)
  return new Date(2025, (month ?? 1) - 1, day, hour, minute).getTime()
}
</script>

<template>
  <section class="px-5 pb-4" aria-labelledby="recent-benefit-title">
    <div class="flex items-center justify-between pt-1 pb-4">
      <h2 id="recent-benefit-title" class="text-subheading font-semibold text-charcoal">
        최근 전체 내역
      </h2>
      <RouterLink
        :to="{
          name: 'home-benefits',
          query: props.selectedCardId ? { userCardId: props.selectedCardId } : undefined,
        }"
        class="flex items-center gap-0.5 text-body font-medium text-brown"
      >
        전체보기
        <ChevronRight class="size-3" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="isLoading" aria-label="최근 결제 내역 로딩 중" class="space-y-2">
      <Skeleton v-for="index in 3" :key="index" class="h-16.5 w-full rounded-md" />
    </div>
    <EmptyState
      v-else-if="error"
      :title="error"
      description="잠시 후 다시 시도해 주세요."
      action-label="다시 시도"
      @action="emit('retry')"
    />
    <EmptyState
      v-else-if="visibleItems.length === 0"
      title="최근 결제 내역이 없어요"
      description="카드 결제 내역이 생기면 이곳에서 확인할 수 있어요."
    />
    <BenefitHistoryList v-else :items="visibleItems" @select="emit('select', $event)" />
  </section>
</template>
