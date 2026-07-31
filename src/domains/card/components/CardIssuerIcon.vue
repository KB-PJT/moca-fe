<script setup lang="ts">
import { CARD_ISSUERS, type CardIssuerId } from '@/domains/card/constants/cardIssuers'

withDefaults(
  defineProps<{
    issuer: CardIssuerId
    variant?: 'default' | 'fill'
  }>(),
  {
    variant: 'default',
  },
)
</script>

<template>
  <span class="flex size-10 items-center justify-center" aria-hidden="true">
    <img :src="CARD_ISSUERS[issuer].logos[variant]" alt="" class="size-10 object-contain" />
  </span>
</template>
