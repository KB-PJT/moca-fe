<script setup lang="ts">
import { useRouter } from 'vue-router'
import CardIssuerIcon from '@/domains/card/components/CardIssuerIcon.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { CARD_ISSUER_SELECTION_LIST, type CardIssuerId } from '@/domains/card/constants/cardIssuers'

const router = useRouter()

function returnToCardConnect() {
  void router.replace({ name: 'card-connect' })
}

function selectIssuer(issuerId: CardIssuerId) {
  void router.push({
    name: 'card-issuer-connect',
    params: { issuerId },
  })
}
</script>

<template>
  <CardPageLayout bg="screen" @back="returnToCardConnect">
    <section>
      <h1 class="text-subheading text-charcoal">카드사를 선택해 주세요</h1>
      <p class="mt-1.5 text-body text-gray">선택한 카드사의 카드 정보를 불러올게요</p>
    </section>

    <ul class="mt-5 grid grid-cols-2 gap-3" aria-label="카드사 목록">
      <li v-for="issuer in CARD_ISSUER_SELECTION_LIST" :key="issuer.id">
        <button
          type="button"
          class="flex h-16 w-full items-center gap-3 rounded-md border border-border bg-card px-4 text-left transition-colors hover:border-primary/40 active:bg-accent"
          @click="selectIssuer(issuer.id)"
        >
          <CardIssuerIcon :issuer="issuer.id" variant="fill" />
          <span class="text-body font-semibold text-charcoal whitespace-nowrap">
            {{ issuer.name }}
          </span>
        </button>
      </li>
    </ul>
  </CardPageLayout>
</template>
