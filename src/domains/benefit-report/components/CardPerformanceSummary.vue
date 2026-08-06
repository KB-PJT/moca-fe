<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ApexOptions } from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'
import type { CardPerformance } from '@/domains/benefit-report/api/benefitReport.mock'

const props = defineProps<{
  cards: CardPerformance[]
}>()

// ApexCharts가 탭 전환(v-if) 직후 부모 너비가 자리잡기 전에 측정해
// 좁은 값으로 굳어버리는 문제가 있어, 컨테이너 크기가 바뀔 때마다
// window resize 이벤트를 쏴서 ApexCharts가 다시 측정하도록 한다.
const wrapperEl = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()

  resizeObserver = new ResizeObserver(() => {
    window.dispatchEvent(new Event('resize'))
  })

  if (wrapperEl.value) {
    resizeObserver.observe(wrapperEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

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

const series = computed(() => [
  {
    name: '이번 달',
    data: props.cards.map((card) => achievementRate(card)),
  },
  {
    name: '지난달',
    data: props.cards.map((card) => previousAchievementRate(card)),
  },
])

const currentMonthMarkers = computed(() =>
  props.cards.map((card, index) => ({
    seriesIndex: 0,
    dataPointIndex: index,
    fillColor: card.accentColor,
    strokeColor: '#ffffff',
    size: 5,
  })),
)

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'line',
    width: '100%',
    background: 'transparent',
    fontFamily: FONT_SANS,
    toolbar: { show: false },
    zoom: { enabled: false },
    offsetX: 0,
    offsetY: 0,
    parentHeightOffset: 0,
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 500,
    },
  },
  legend: {
    show: false,
  },
  colors: ['#ff8836', '#cdc2b4'],
  stroke: {
    curve: 'smooth',
    width: [3, 1.5],
    dashArray: [0, 5],
  },
  markers: {
    size: [5, 3],
    strokeWidth: 2,
    strokeColors: '#ffffff',
    discrete: currentMonthMarkers.value,
    hover: { size: 6 },
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    type: 'category',
    categories: props.cards.map((card) => splitLabel(card.cardName)),
    tickPlacement: 'on',
    tooltip: { enabled: false },
    crosshairs: { show: false },
    labels: {
      rotate: 0,
      rotateAlways: false,
      style: {
        fontSize: '12px',
        fontFamily: FONT_SANS,
        colors: '#8a8178',
      },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    show: true,
    min: 0,
    max: 100,
    tickAmount: 5,
    labels: {
      offsetX: -16,
      formatter: (value: number) => `${value}%`,
      style: {
        fontSize: '11px',
        fontFamily: FONT_SANS,
        colors: '#8a8178',
      },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  grid: {
    show: true,
    borderColor: 'rgba(74, 66, 56, 0.08)',
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 8, right: 0, bottom: 0, left: 0 },
  },
  tooltip: {
    enabled: false,
  },
}))
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

    <div ref="wrapperEl" class="w-full">
      <VueApexCharts
        type="line"
        width="100%"
        height="240"
        :options="chartOptions"
        :series="series"
      />
    </div>
  </div>
</template>
