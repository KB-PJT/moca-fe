<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import VueApexCharts from 'vue3-apexcharts'
import {
  BENEFIT_TYPE_COLORS,
  type BenefitBreakdownItem,
} from '@/domains/benefit-report/api/benefitReport.mock'

const props = withDefaults(
  defineProps<{
    breakdown: BenefitBreakdownItem[]
    size?: number
  }>(),
  {
    size: 96,
  },
)

const FONT_SANS =
  "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"

const series = computed(() => props.breakdown.map((item) => item.amount))

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    fontFamily: FONT_SANS,
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 500,
    },
  },
  labels: props.breakdown.map((item) => item.label),
  colors: props.breakdown.map((item) => BENEFIT_TYPE_COLORS[item.type]),
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 0,
  },
  legend: {
    show: false,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: false,
        },
      },
    },
  },
  tooltip: {
    enabled: false,
  },
}))
</script>

<template>
  <VueApexCharts
    type="donut"
    :width="size"
    :height="size"
    :options="chartOptions"
    :series="series"
  />
</template>
