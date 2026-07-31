<script setup lang="ts">
import { useRouter } from 'vue-router'
import CardIssuerIcon from '@/domains/card/components/CardIssuerIcon.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import CardSearchIllustration from '@/domains/card/components/CardSearchIllustration.vue'
import { CARD_ISSUER_LIST } from '@/domains/card/constants/cardIssuers'
import MocaButton from '@/shared/components/MocaButton.vue'

const router = useRouter()

function connectAllCards() {
  void router.push({ name: 'card-bulk-connect' })
}

function selectCardIssuers() {
  void router.push({ name: 'card-issuer-select' })
}
</script>

<template>
  <CardPageLayout bg="screen">
    <div class="flex min-h-148 flex-col">
      <section class="px-1 pt-1">
        <h1 class="text-display text-charcoal">
          불러올 카드를<br />
          찾아볼게요
        </h1>
        <p class="text-body text-gray mt-3.5">
          보유한 카드를 연동해 혜택과 실적을<br />
          한눈에 확인할 수 있어요
        </p>
      </section>

      <CardSearchIllustration class="mx-auto mt-7.5 w-50" />

      <section class="mt-auto">
        <div class="mx-auto w-full max-w-80">
          <h2 class="text-caption text-gray mb-4">주요 카드사</h2>
          <ul class="grid grid-cols-3 gap-x-4 gap-y-5">
            <li
              v-for="issuer in CARD_ISSUER_LIST"
              :key="issuer.id"
              class="flex flex-col items-center justify-center gap-2"
            >
              <CardIssuerIcon :issuer="issuer.id" />
              <span class="text-caption text-charcoal whitespace-nowrap">{{ issuer.name }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <MocaButton block class="h-14 text-subheading!" @click="connectAllCards">
          내 카드 한번에 불러오기
        </MocaButton>
        <MocaButton
          block
          variant="secondary"
          class="h-14 text-subheading!"
          @click="selectCardIssuers"
        >
          기관 직접 선택하기
        </MocaButton>
      </div>
    </template>
  </CardPageLayout>
</template>
