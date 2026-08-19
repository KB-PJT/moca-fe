<script setup lang="ts">
import type { Merchant } from '@/domains/map/api/merchants'
import MerchantInfoHeader from '@/domains/map/components/MerchantInfoHeader.vue'
import MerchantCardRecommendation from '@/domains/map/components/MerchantCardRecommendation.vue'

interface Props {
  merchant: Merchant
  // 압축 시트에서는 요약(헤더+MOCA 추천카드)만 보이고, 펼쳐졌을 때만 상세 내용까지 보인다.
  expanded?: boolean
  // 상세에서 압축으로 되돌아가는 중(shrink 애니메이션 진행 중)인지. 상세 전용 콘텐츠를
  // 이 시점에 맞춰 미리 페이드아웃시키는 데 쓴다.
  collapsing?: boolean
}

defineProps<Props>()
</script>

<template>
  <div>
    <div class="bg-divider mx-auto mb-3 h-1 w-10 rounded-full" />

    <MerchantInfoHeader :merchant="merchant" />

    <MerchantCardRecommendation
      :merchant="merchant"
      :expanded="expanded"
      :collapsing="collapsing"
    />
  </div>
</template>
