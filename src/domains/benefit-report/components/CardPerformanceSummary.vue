<script setup lang="ts">
import { computed } from 'vue'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { CardPerformance } from '@/domains/benefit-report/api/benefitReport.mock'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Legend,
  Tooltip,
)

const props = defineProps<{
  cards: CardPerformance[]
}>()

const FONT_SANS =
  "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"

function rateOf(amount: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.floor((amount / target) * 100))
}

function achievementRate(card: CardPerformance): number {
  return rateOf(card.currentAmount, card.tier2TargetAmount)
}

function previousAchievementRate(card: CardPerformance): number {
  return rateOf(card.previousAmount, card.tier2TargetAmount)
}

function splitLabel(name: string): [string, string] {
  const spaceIndex = name.indexOf(' ')
  if (spaceIndex === -1) return [name, '']
  return [name.slice(0, spaceIndex), name.slice(spaceIndex + 1)]
}

const completedCount = computed(
  () => props.cards.filter((card) => achievementRate(card) >= 100).length,
)

const chartData = computed(() => ({
  labels: props.cards.map((card) => splitLabel(card.cardName)),
  datasets: [
    {
      label: '이번 달',
      data: props.cards.map((card) => achievementRate(card)),
      borderColor: '#ff8836',
      backgroundColor: '#ff8836',
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 6,
      pointBackgroundColor: props.cards.map((card) => card.accentColor),
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
    {
      label: '지난달',
      data: props.cards.map((card) => previousAchievementRate(card)),
      borderColor: '#cdc2b4',
      backgroundColor: '#cdc2b4',
      borderWidth: 1.5,
      borderDash: [5, 5],
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 4,
      pointBackgroundColor: '#cdc2b4',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  clip: false as const,
  layout: {
    padding: {
      top: 10,
    },
  },
  animation: {
    duration: 400,
    easing: 'easeInOutQuad' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: {
      offset: true,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#8a8178',
        font: { size: 12, family: FONT_SANS },
      },
    },
    y: {
      min: 0,
      max: 100,
      border: { display: false },
      ticks: {
        stepSize: 20,
        color: '#8a8178',
        font: { size: 11, family: FONT_SANS },
        callback: (value: string | number) => `${value}%`,
      },
      grid: {
        color: 'rgba(74, 66, 56, 0.08)',
        borderDash: [4, 4],
      },
    },
  },
}
</script>

<template>
  <div class="rounded-lg bg-accent px-4 py-2.5 shadow-card">
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-[18px] leading-6 font-bold text-charcoal">실적 달성률</p>
      </div>
      <span class="shrink-0 rounded-full bg-card px-2 py-1 text-caption font-bold text-primary">
        {{ completedCount }}/{{ cards.length }} 달성
      </span>
    </div>

    <div class="mt-1 flex items-center gap-3">
      <span class="flex items-center gap-1.5 text-caption text-gray">
        <span class="h-0.5 w-3 rounded-full bg-primary" />
        이번 달
      </span>
      <span class="flex items-center gap-1.5 text-caption text-gray">
        <span class="h-0.5 w-3 rounded-full bg-[#cdc2b4]" />
        지난달
      </span>
    </div>

    <div class="mt-1 h-60 w-full">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
