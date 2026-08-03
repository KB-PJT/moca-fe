<script setup lang="ts">
import { BellOff } from '@lucide/vue'
import { ref } from 'vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { Switch } from '@/shared/ui/switch'

const isDeviceNotificationAllowed = ref(
  typeof Notification !== 'undefined' && Notification.permission === 'granted',
)
const allNotificationsEnabled = ref(true)
const performanceNotificationEnabled = ref(true)
const nearbyBenefitNotificationEnabled = ref(true)
const benefitLimitNotificationEnabled = ref(false)
const marketingNotificationEnabled = ref(false)

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return

  const permission = await Notification.requestPermission()
  isDeviceNotificationAllowed.value = permission === 'granted'
}

function updateAllNotifications(enabled: boolean) {
  allNotificationsEnabled.value = enabled

  if (!enabled) {
    performanceNotificationEnabled.value = false
    nearbyBenefitNotificationEnabled.value = false
    benefitLimitNotificationEnabled.value = false
    marketingNotificationEnabled.value = false
  }
}
</script>

<template>
  <PageLayout title="알림 설정" has-bottom-bar>
    <div class="-mx-5 -my-6 pb-4">
      <aside
        v-if="!isDeviceNotificationAllowed"
        class="mx-5 mt-4 flex items-center gap-3 rounded-md bg-[#FEF3C7] p-4"
        aria-label="기기 알림 권한 안내"
      >
        <BellOff class="size-4.5 shrink-0 text-[#B45309]" aria-hidden="true" />
        <span class="min-w-0 flex-1">
          <strong class="text-caption block font-bold text-[#92400E]">
            기기 알림 권한이 꺼져 있어요.
          </strong>
          <span class="text-label block font-normal text-[#B45309]">
            알림을 받으려면 권한을 허용해주세요.
          </span>
        </span>
        <button
          type="button"
          class="text-label shrink-0 rounded-full bg-[#92400E] px-2.5 py-1.5 font-bold text-white"
          @click="requestNotificationPermission"
        >
          설정으로 이동
        </button>
      </aside>

      <div class="px-5 pt-4">
        <SectionCard
          flush
          aria-label="전체 알림 설정"
          class="mb-0 overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
        >
          <div class="flex min-h-14.25 items-center gap-3 px-5">
            <span class="text-body flex-1 font-semibold text-charcoal">전체 알림</span>
            <Switch
              :model-value="allNotificationsEnabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="전체 알림"
              @update:model-value="updateAllNotifications"
            />
          </div>
        </SectionCard>
      </div>

      <div class="px-5 pt-5">
        <h2 class="text-caption mb-2 font-bold tracking-[0.05em] text-[#8C7F74]">알림 종류</h2>
        <SectionCard
          flush
          class="mb-0 overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
        >
          <div class="flex min-h-17.25 items-center gap-3 border-b border-black/5 px-5 py-4">
            <span class="min-w-0 flex-1">
              <strong class="text-body block font-semibold text-charcoal">실적 마감 알림</strong>
              <span class="text-label mt-0.5 block font-normal text-[#8C7F74]">
                실적 충족이 임박한 카드를 알려줘요
              </span>
            </span>
            <Switch
              v-model="performanceNotificationEnabled"
              :disabled="!allNotificationsEnabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="실적 마감 알림"
            />
          </div>

          <div class="flex min-h-17.25 items-center gap-3 border-b border-black/5 px-5 py-4">
            <span class="min-w-0 flex-1">
              <strong class="text-body block font-semibold text-charcoal">주변 혜택 알림</strong>
              <span class="text-label mt-0.5 block font-normal text-[#8C7F74]">
                점심·저녁 시간대 주변 가맹점 혜택을 알려줘요
              </span>
            </span>
            <Switch
              v-model="nearbyBenefitNotificationEnabled"
              :disabled="!allNotificationsEnabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="주변 혜택 알림"
            />
          </div>

          <div class="flex min-h-17.25 items-center gap-3 px-5 py-4">
            <span class="min-w-0 flex-1">
              <strong class="text-body block font-semibold text-charcoal">혜택 한도 알림</strong>
              <span class="text-label mt-0.5 block font-normal text-[#8C7F74]">
                혜택 한도가 남아 있거나 모두 소진되면 알려줘요
              </span>
            </span>
            <Switch
              v-model="benefitLimitNotificationEnabled"
              :disabled="!allNotificationsEnabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="혜택 한도 알림"
            />
          </div>
        </SectionCard>
      </div>

      <div class="px-5 pt-5">
        <h2 class="text-caption mb-2 font-bold tracking-[0.05em] text-[#8C7F74]">선택 알림</h2>
        <SectionCard
          flush
          class="mb-0 overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
        >
          <div class="flex min-h-17.25 items-center gap-3 px-5 py-4">
            <span class="min-w-0 flex-1">
              <strong class="text-body block font-semibold text-charcoal">마케팅 정보 알림</strong>
              <span class="text-label mt-0.5 block font-normal text-[#8C7F74]">
                이벤트·프로모션 소식을 받아볼 수 있어요
              </span>
            </span>
            <Switch
              v-model="marketingNotificationEnabled"
              :disabled="!allNotificationsEnabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="마케팅 정보 알림"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  </PageLayout>
</template>
