<script setup lang="ts">
import { computed } from 'vue'
import { Bus, Coffee, Store, Tag, type LucideIcon } from '@lucide/vue'
import type { CategorySavingItem } from '@/domains/benefit-report/api/benefitReport.mock'
import { formatAmountWithUnit } from '@/shared/utils/format'

const props = defineProps<{
  items: CategorySavingItem[]
}>()

const RANK_MEDAL: Record<1 | 2 | 3, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  카페: Coffee,
  편의점: Store,
  교통: Bus,
}

function iconFor(category: string) {
  return CATEGORY_ICONS[category] ?? Tag
}

const first = computed(() => props.items.find((item) => item.rank === 1))
const rest = computed(() => props.items.filter((item) => item.rank !== 1))
</script>

<template>
  <div>
    <p class="text-subheading font-bold text-charcoal">카테고리별 TOP3</p>

    <div
      v-if="first"
      class="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-4 shadow-card"
    >
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
      >
        <component :is="iconFor(first.category)" class="size-5" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <span class="text-body font-bold text-charcoal">{{ first.category }}</span>
          <span class="text-caption font-bold text-primary">{{ RANK_MEDAL[1] }} 1위</span>
        </div>
        <p class="mt-0.5 truncate text-caption text-gray">이번 달 가장 많이 절약한 카테고리</p>
      </div>

      <span class="shrink-0 text-body font-bold text-charcoal">
        {{ formatAmountWithUnit(first.amount).replace('원', '')
        }}<span class="text-caption font-normal text-gray">원</span>
      </span>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2">
      <div
        v-for="item in rest"
        :key="item.rank"
        class="rounded-lg border border-divider bg-card p-3 shadow-card"
      >
        <div class="flex items-center justify-between">
          <span class="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
            <component :is="iconFor(item.category)" class="size-4" />
          </span>
          <span class="text-caption font-semibold text-gray"
            >{{ RANK_MEDAL[item.rank] }} {{ item.rank }}위</span
          >
        </div>
        <p class="mt-2 text-caption text-gray">{{ item.category }}</p>
        <p class="text-body font-bold text-charcoal">
          {{ formatAmountWithUnit(item.amount).replace('원', '')
          }}<span class="text-caption font-normal text-gray">원</span>
        </p>
      </div>
    </div>
  </div>
</template>
