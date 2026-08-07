<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import BenefitHistoryList from '@/domains/home/components/BenefitHistoryList.vue'
import type { RecentBenefitItem } from '@/domains/home/mocks/recentBenefits'

interface Props {
  items: RecentBenefitItem[]
}

const props = defineProps<Props>()
const visibleItems = computed(() =>
  [...props.items]
    .sort((left, right) => parseOccurredAt(right.occurredAt) - parseOccurredAt(left.occurredAt))
    .slice(0, 5),
)

const emit = defineEmits<{
  select: [item: RecentBenefitItem]
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
        :to="{ name: 'home-benefits' }"
        class="flex items-center gap-0.5 text-caption font-semibold text-brown"
      >
        전체보기
        <ChevronRight class="size-3" aria-hidden="true" />
      </RouterLink>
    </div>

    <BenefitHistoryList :items="visibleItems" @select="emit('select', $event)" />
  </section>
</template>
