<script setup lang="ts">
import type { Merchant } from '@/domains/map/api/merchants.mock'
import MerchantInfoHeader from '@/domains/map/components/MerchantInfoHeader.vue'
import MerchantCardRecommendation from '@/domains/map/components/MerchantCardRecommendation.vue'

interface Props {
  merchant: Merchant
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div>
    <div class="bg-divider mx-auto mb-3 h-1 w-10 rounded-full" />

    <MerchantInfoHeader :merchant="merchant" @close="emit('close')" />

    <MerchantCardRecommendation :merchant="merchant" />
  </div>
</template>
