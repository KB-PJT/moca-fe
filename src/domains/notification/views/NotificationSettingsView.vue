<script setup lang="ts">
import { BellOff } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import {
  fetchNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from '@/domains/notification/api/notificationSettings'
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { Switch } from '@/shared/ui/switch'

const isDeviceNotificationAllowed = ref(
  typeof Notification !== 'undefined' && Notification.permission === 'granted',
)
const settings = ref<NotificationSettings>({
  performanceClosingEnabled: false,
  nearbyBenefitEnabled: false,
  benefitLimitEnabled: false,
  marketingEnabled: false,
})
const isLoading = ref(true)
const isSaving = ref(false)
const hasLoadedSettings = ref(false)
const settingsError = ref('')
const settingsErrorType = ref<'load' | 'save' | null>(null)
const failedSaveSettings = ref<NotificationSettings | null>(null)

const allNotificationsEnabled = computed(() => Object.values(settings.value).every(Boolean))
const isSettingsInteractionDisabled = computed(
  () => !hasLoadedSettings.value || isLoading.value || isSaving.value,
)

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return

  const permission = await Notification.requestPermission()
  isDeviceNotificationAllowed.value = permission === 'granted'
}

async function loadNotificationSettings() {
  isLoading.value = true
  hasLoadedSettings.value = false
  settingsError.value = ''
  settingsErrorType.value = null
  failedSaveSettings.value = null

  try {
    settings.value = await fetchNotificationSettings()
    hasLoadedSettings.value = true
  } catch {
    settingsError.value = '알림 설정을 불러오지 못했어요.'
    settingsErrorType.value = 'load'
  } finally {
    isLoading.value = false
  }
}

async function saveNotificationSettings(nextSettings: NotificationSettings) {
  if (!hasLoadedSettings.value || isSaving.value) return

  const previousSettings = { ...settings.value }
  settings.value = nextSettings
  isSaving.value = true
  settingsError.value = ''
  settingsErrorType.value = null
  failedSaveSettings.value = null

  try {
    settings.value = await updateNotificationSettings(nextSettings)
  } catch {
    settings.value = previousSettings
    settingsError.value = '알림 설정을 저장하지 못했어요. 다시 시도해주세요.'
    settingsErrorType.value = 'save'
    failedSaveSettings.value = { ...nextSettings }
  } finally {
    isSaving.value = false
  }
}

function retryNotificationSettings() {
  if (settingsErrorType.value === 'save' && failedSaveSettings.value) {
    void saveNotificationSettings({ ...failedSaveSettings.value })
    return
  }

  void loadNotificationSettings()
}

function updateAllNotifications(enabled: boolean) {
  void saveNotificationSettings({
    performanceClosingEnabled: enabled,
    nearbyBenefitEnabled: enabled,
    benefitLimitEnabled: enabled,
    marketingEnabled: enabled,
  })
}

function updateNotificationSetting(key: keyof NotificationSettings, enabled: boolean) {
  void saveNotificationSettings({ ...settings.value, [key]: enabled })
}

onMounted(loadNotificationSettings)
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
        <div
          v-if="settingsError"
          role="alert"
          class="mb-3 flex items-center justify-between gap-3 rounded-md bg-error/8 px-4 py-3 text-caption text-error"
        >
          <span>{{ settingsError }}</span>
          <button
            v-if="!isSaving"
            type="button"
            class="shrink-0 font-bold underline underline-offset-2"
            @click="retryNotificationSettings"
          >
            다시 시도
          </button>
        </div>

        <SectionCard
          flush
          aria-label="전체 알림 설정"
          class="mb-0 overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
        >
          <div class="flex min-h-14.25 items-center gap-3 px-5">
            <span class="text-body flex-1 font-semibold text-charcoal">전체 알림</span>
            <Switch
              :model-value="allNotificationsEnabled"
              :disabled="isSettingsInteractionDisabled"
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
              :model-value="settings.performanceClosingEnabled"
              :disabled="isSettingsInteractionDisabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="실적 마감 알림"
              @update:model-value="updateNotificationSetting('performanceClosingEnabled', $event)"
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
              :model-value="settings.nearbyBenefitEnabled"
              :disabled="isSettingsInteractionDisabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="주변 혜택 알림"
              @update:model-value="updateNotificationSetting('nearbyBenefitEnabled', $event)"
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
              :model-value="settings.benefitLimitEnabled"
              :disabled="isSettingsInteractionDisabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="혜택 한도 알림"
              @update:model-value="updateNotificationSetting('benefitLimitEnabled', $event)"
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
              :model-value="settings.marketingEnabled"
              :disabled="isSettingsInteractionDisabled"
              class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
              aria-label="마케팅 정보 알림"
              @update:model-value="updateNotificationSetting('marketingEnabled', $event)"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  </PageLayout>
</template>
