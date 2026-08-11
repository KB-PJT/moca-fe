<script setup lang="ts">
import { computed } from 'vue'
import { ArcElement, Chart as ChartJS, DoughnutController, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import {
  BENEFIT_TYPE_COLORS,
  type BenefitBreakdownItem,
} from '@/domains/benefit-report/api/benefitReport'

ChartJS.register(ArcElement, DoughnutController, Legend, Tooltip)

const props = withDefaults(
  defineProps<{
    breakdown: BenefitBreakdownItem[]
    size?: number
  }>(),
  {
    size: 96,
  },
)

const chartData = computed(() => ({
  labels: props.breakdown.map((item) => item.label),
  datasets: [
    {
      data: props.breakdown.map((item) => item.amount),
      backgroundColor: props.breakdown.map((item) => BENEFIT_TYPE_COLORS[item.type]),
      borderWidth: 0,
    },
  ],
}))

const chartOptions = {
  responsive: false,
  cutout: '68%',
  animation: {
    duration: 400,
    easing: 'easeInOutQuad' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}
</script>

<template>
  <Doughnut :data="chartData" :options="chartOptions" :width="size" :height="size" />
</template>
