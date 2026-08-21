<script setup lang="ts">
import { Store } from '@lucide/vue'
import { useRouter } from 'vue-router'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import kbCardLogo from '@/domains/card/assets/issuer-logos/kb-fill.svg'

const weshDailyCardImage =
  'https://img1.kbcard.com/ST/img/cxc/kbcard/upload/img/product/09570_img.png'

const router = useRouter()

function viewCardLater() {
  void router.push({ name: 'mypage' })
}

function openCardDetail() {
  window.open(
    'https://card.kbcard.com/CRD/DVIEW/HCAMCXPRICAC0076?mainCC=a&cooperationcode=09570',
    '_blank',
    'noopener,noreferrer',
  )
}
</script>

<template>
  <PageLayout title="맞춤 카드 추천" has-bottom-bar class="relative">
    <div class="flex min-h-full flex-col gap-10">
      <section class="px-5 text-center">
        <div class="flex flex-col items-center">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-screen text-primary"
          >
            <Store class="size-5" />
          </span>
          <p class="mt-2 text-caption font-semibold text-gray">방금 결제 소비 분석</p>
          <h2 class="mt-1 text-subheading text-charcoal">이번 달 편의점 6번째 이용이에요</h2>
          <p class="mt-2 text-caption text-gray">이번 달 편의점에서 총 48,700원을 결제했어요</p>
        </div>
      </section>

      <section class="flex min-h-0 flex-1 flex-col">
        <p class="text-caption font-semibold text-primary">소비패턴 맞춤 추천</p>
        <h2 class="mt-1 text-subheading text-charcoal">편의점 혜택이 큰 카드를 추천해요</h2>

        <div
          class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-divider/60 bg-linear-to-br from-card to-accent"
        >
          <div class="flex min-h-48 flex-1 items-center justify-center gap-8 px-6 py-4">
            <div class="relative flex h-47 w-30 shrink-0 items-center justify-center">
              <img
                :src="weshDailyCardImage"
                alt="KB국민 WE:SH Daily 카드"
                class="h-30 w-47 max-w-none rotate-90 rounded-sm shadow-card"
              />
            </div>
            <div class="min-w-0">
              <span
                class="inline-flex items-center gap-2 py-1.5 pr-3.5 pl-1.5 text-caption font-bold text-charcoal"
              >
                <img :src="kbCardLogo" alt="" class="size-7 rounded-sm" />
                KB국민카드
              </span>
              <p class="mt-2 text-heading text-charcoal">WE:SH Daily 카드</p>
              <p class="mt-1 text-caption text-gray">편의점 선택 할인</p>
              <p class="mt-1 text-heading text-primary">GS25·CU 10%</p>
            </div>
          </div>

          <div class="border-t border-divider px-5 py-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-body font-semibold text-charcoal">이번 달 받을 수 있었던 혜택</p>
                <p class="mt-0.5 text-label font-normal text-gray">편의점 이용 48,700원 기준</p>
              </div>
              <strong class="text-subheading text-primary">4,870원</strong>
            </div>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="grid grid-cols-2 gap-3">
        <MocaButton
          variant="secondary"
          block
          class="h-13 rounded-md text-subheading text-primary!"
          @click="viewCardLater"
        >
          카드 다음에 보기
        </MocaButton>
        <MocaButton
          block
          class="h-13 rounded-md text-subheading text-white!"
          @click="openCardDetail"
        >
          카드 자세히 보기
        </MocaButton>
      </div>
    </template>
  </PageLayout>
</template>
