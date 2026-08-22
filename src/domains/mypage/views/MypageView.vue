<script setup lang="ts">
import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Pencil,
} from '@lucide/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchBenefitPreference, logoutFromMoca } from '@/domains/auth/api/auth'
import { getBenefitPreferenceLabel } from '@/domains/auth/constants/benefitPreference'
import { fetchMyCards } from '@/domains/card/api/cardManagement'
import { fetchMyPageSummary, updateLocationPermissionGranted } from '@/domains/mypage/api/mypage'
import {
  getCurrentFcmToken,
  removeFcmToken,
} from '@/domains/notification/services/firebaseMessaging'
import { useAuthStore } from '@/domains/auth/stores/auth'
import ListItem from '@/shared/components/ListItem.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Switch } from '@/shared/ui/switch'

const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const isLogoutDialogOpen = ref(false)
const isLoggingOut = ref(false)
const isLocationOffConfirmOpen = ref(false)
const locationPermissionError = ref('')
const browserLocationPermission = ref<PermissionState | 'unsupported'>('prompt')
const toast = ref<{ message: string; role: 'status' | 'alert' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
let locationPermissionStatus: PermissionStatus | undefined

function showToast(message: string, role: 'status' | 'alert' = 'status') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, role }
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2000)
}

function handleBrowserLocationPermissionChange() {
  if (!locationPermissionStatus) return

  browserLocationPermission.value = locationPermissionStatus.state
  if (locationPermissionStatus.state === 'denied') {
    locationPermissionError.value = '브라우저 설정에서 위치 권한을 허용해주세요.'
    showToast('브라우저 위치 권한이 차단되었어요.', 'alert')
  } else {
    locationPermissionError.value = ''
  }
}

async function initializeBrowserLocationPermission() {
  if (!navigator.geolocation || !navigator.permissions) {
    browserLocationPermission.value = 'unsupported'
    return
  }

  try {
    locationPermissionStatus = await navigator.permissions.query({ name: 'geolocation' })
    browserLocationPermission.value = locationPermissionStatus.state
    locationPermissionStatus.addEventListener('change', handleBrowserLocationPermissionChange)
  } catch {
    browserLocationPermission.value = 'unsupported'
  }
}

onMounted(() => {
  void initializeBrowserLocationPermission()

  if (window.history.state?.inquirySubmitted) {
    showToast('문의가 접수되었습니다.')

    const nextState = { ...window.history.state }
    delete nextState.inquirySubmitted
    window.history.replaceState(nextState, '')
  }
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
  locationPermissionStatus?.removeEventListener('change', handleBrowserLocationPermissionChange)
})

const {
  data: summary,
  isPending: isSummaryPending,
  isError: isSummaryError,
  refetch: refetchSummary,
} = useQuery({
  queryKey: ['mypage', 'summary'],
  queryFn: fetchMyPageSummary,
})

const {
  data: myCards,
  isPending: isMyCardsPending,
  isError: isMyCardsError,
  refetch: refetchMyCards,
} = useQuery({
  queryKey: ['cards', 'my-cards'],
  queryFn: fetchMyCards,
})

const {
  data: benefitPreference,
  isPending: isBenefitPreferencePending,
  isError: isBenefitPreferenceError,
} = useQuery({
  queryKey: ['auth', 'benefit-preference'],
  queryFn: fetchBenefitPreference,
})

const { mutateAsync: updateLocationPermission, isPending: isLocationPermissionUpdating } =
  useMutation({
    mutationFn: updateLocationPermissionGranted,
    onSuccess: (updatedSummary) => {
      queryClient.setQueryData(['mypage', 'summary'], updatedSummary)
    },
  })

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const connectedCardCount = computed(() => myCards.value?.activeCards.length ?? 0)
const connectedCardDescription = computed(() => {
  if (isMyCardsPending.value) return '카드 정보를 불러오는 중'
  if (isMyCardsError.value) return '카드 정보를 불러오지 못했어요'
  return `등록한 카드 ${connectedCardCount.value}개`
})
const locationRecommendationEnabled = computed(
  () => summary.value?.locationRecommendationEnabled ?? false,
)
const benefitPreferenceDescription = computed(() => {
  if (isBenefitPreferencePending.value) return '선호 혜택을 불러오는 중'
  if (isBenefitPreferenceError.value) return '선호 혜택을 불러오지 못했어요'
  return getBenefitPreferenceLabel(benefitPreference.value!)
})
const locationSettingDescription = computed(() => {
  if (isSummaryPending.value) return '설정을 불러오는 중'
  if (isSummaryError.value) return '설정을 불러오지 못했어요'
  if (!locationRecommendationEnabled.value) return '허용 안 됨'
  if (browserLocationPermission.value === 'denied') return '브라우저 권한 차단됨'
  if (browserLocationPermission.value === 'unsupported') return '브라우저에서 확인할 수 없음'
  return '허용됨'
})

function navigateToCardManage() {
  void router.push({ name: 'card-manage', query: { from: 'mypage' } })
}

function retryMyCards() {
  void refetchMyCards()
}

function retrySummary() {
  void refetchSummary()
}

function navigateToProfile() {
  void router.push({ name: 'mypage-profile' })
}

function navigateToNotificationSettings() {
  void router.push({ name: 'notification-settings' })
}

function navigateToBenefitPreference() {
  void router.push({ name: 'mypage-benefit-preference' })
}

function navigateToNotices() {
  void router.push({ name: 'mypage-notices' })
}

function navigateToInquiry() {
  void router.push({ name: 'mypage-inquiry' })
}

function navigateToDeleteAccount() {
  void router.push({ name: 'mypage-delete-account' })
}

function requestBrowserLocationPermission() {
  return new Promise<boolean>((resolve) => {
    if (!navigator.geolocation) {
      resolve(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    )
  })
}

async function handleLocationPermissionChange(enabled: boolean) {
  locationPermissionError.value = ''

  if (enabled) {
    const isGranted = await requestBrowserLocationPermission()
    if (!isGranted) {
      locationPermissionError.value = '브라우저 설정에서 위치 권한을 허용해주세요.'
      showToast('브라우저 위치 권한을 허용해주세요.', 'alert')
      return
    }

    browserLocationPermission.value = 'granted'
    try {
      await updateLocationPermission(true)
      showToast('위치 기반 추천을 켰어요.')
    } catch {
      showToast('위치 설정을 변경하지 못했어요.', 'alert')
    }
    return
  }

  isLocationOffConfirmOpen.value = true
}

async function confirmTurnOffLocation() {
  isLocationOffConfirmOpen.value = false
  try {
    await updateLocationPermission(false)
    showToast('위치 기반 추천을 껐어요.')
  } catch {
    showToast('위치 설정을 변경하지 못했어요.', 'alert')
  }
}

async function handleLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  const fcmToken = await getCurrentFcmToken().catch(() => null)

  try {
    await logoutFromMoca(fcmToken)
  } catch {
    isLoggingOut.value = false
    showToast('로그아웃하지 못했어요. 다시 시도해주세요.', 'alert')
    return
  }

  await removeFcmToken().catch(() => undefined)
  authStore.clearSession()
  isLogoutDialogOpen.value = false
  await router.replace({ name: 'login' }).catch(() => undefined)
  isLoggingOut.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="-translate-y-2 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="-translate-y-2 opacity-0"
  >
    <div
      v-if="toast"
      :role="toast.role"
      class="absolute top-[max(1rem,var(--safe-area-top))] right-5 left-5 z-50 rounded-md border bg-background px-4 py-3 text-center text-body font-semibold text-muted-foreground shadow-lg"
    >
      {{ toast.message }}
    </div>
  </Transition>

  <PageLayout hide-app-bar has-bottom-bar>
    <MainHeader title="마이" />

    <section
      aria-labelledby="mypage-profile-heading"
      class="mb-6 w-full rounded-lg border border-divider bg-card p-5"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center">
            <strong id="mypage-profile-heading" class="text-subheading text-charcoal">
              {{ nickname }}님
            </strong>
            <button
              type="button"
              class="-my-2 ml-1 flex size-11 items-center justify-center rounded-full"
              aria-label="프로필 수정"
              @click="navigateToProfile"
            >
              <span
                class="flex size-7 items-center justify-center rounded-full bg-screen text-primary"
                aria-hidden="true"
              >
                <Pencil class="size-4" />
              </span>
            </button>
          </div>
          <span class="mt-1 block text-caption font-semibold text-gray">
            Google 계정으로 이용 중
          </span>
          <span
            v-if="isMyCardsPending"
            class="mt-2 flex items-center gap-1 text-label text-gray"
            aria-live="polite"
          >
            <CreditCard class="size-3" />
            연결 카드 조회 중
          </span>
          <div
            v-else-if="isMyCardsError"
            class="mt-2 flex items-center gap-2 text-label text-error"
          >
            <span class="flex items-center gap-1">
              <CreditCard class="size-3" />
              카드 조회 실패
            </span>
            <button type="button" class="font-semibold underline" @click="retryMyCards">
              다시 시도
            </button>
          </div>
          <span v-else class="mt-2 flex items-center gap-1 text-label text-primary">
            <CreditCard class="size-3" />
            연결 카드 {{ connectedCardCount }}개
          </span>
        </div>
      </div>
    </section>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">내 서비스 관리</h2>
    <SectionCard flush class="overflow-hidden rounded-lg border border-divider bg-card">
      <ListItem
        title="내 카드 관리"
        :description="connectedCardDescription"
        clickable
        @click="navigateToCardManage"
      >
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <CreditCard class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem
        title="혜택 선호 관리"
        :description="benefitPreferenceDescription"
        clickable
        @click="navigateToBenefitPreference"
      >
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <Heart class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem
        title="알림 설정"
        description="실적·주변 혜택 알림 관리"
        clickable
        @click="navigateToNotificationSettings"
      >
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <Bell class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem
        title="위치 권한 설정"
        :description="locationPermissionError || locationSettingDescription"
      >
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <MapPin class="size-4" />
          </span>
        </template>
        <template #right>
          <button
            v-if="isSummaryError"
            type="button"
            class="text-caption font-semibold text-primary"
            @click="retrySummary"
          >
            다시 시도
          </button>
          <Switch
            v-else
            :model-value="locationRecommendationEnabled"
            :disabled="isSummaryPending || isLocationPermissionUpdating"
            class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
            aria-label="위치 권한 설정"
            @update:model-value="handleLocationPermissionChange"
          />
        </template>
      </ListItem>
    </SectionCard>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">고객지원</h2>
    <SectionCard flush class="overflow-hidden rounded-lg border border-divider bg-card">
      <ListItem title="공지사항" clickable @click="navigateToNotices">
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <Megaphone class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem title="문의하기" clickable @click="navigateToInquiry">
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <MessageSquare class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>
    </SectionCard>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">계정 관리</h2>
    <SectionCard flush class="overflow-hidden rounded-lg border border-divider bg-card">
      <ListItem title="로그아웃" clickable @click="isLogoutDialogOpen = true">
        <template #left>
          <span class="flex size-8 items-center justify-center rounded-full bg-screen text-primary">
            <LogOut class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>
    </SectionCard>

    <div class="pb-4 text-center">
      <button
        type="button"
        class="text-caption text-error underline underline-offset-4"
        @click="navigateToDeleteAccount"
      >
        회원 탈퇴
      </button>
    </div>
  </PageLayout>

  <Dialog v-model:open="isLogoutDialogOpen">
    <DialogContent :show-close-button="false" class="w-[calc(100%-2rem)] max-w-85 sm:max-w-85">
      <DialogHeader>
        <DialogTitle>로그아웃 하시겠어요?</DialogTitle>
        <DialogDescription>
          Google 계정과의 연결을 끊고 로그아웃해요.<br />
          다시 로그인하면 모든 데이터를 그대로 이용할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="grid grid-cols-2">
        <DialogClose as-child>
          <MocaButton variant="secondary" block>취소</MocaButton>
        </DialogClose>
        <MocaButton block :loading="isLoggingOut" @click="handleLogout">로그아웃</MocaButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="isLocationOffConfirmOpen">
    <DialogContent :show-close-button="false" class="w-[calc(100%-2rem)] max-w-85 sm:max-w-85">
      <DialogHeader>
        <DialogTitle>위치 기반 서비스를 끄시겠어요?</DialogTitle>
        <DialogDescription>
          위치 기반 서비스를 끄면 주변 혜택 가맹점 추천을<br />
          더 이상 받을 수 없어요.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="grid grid-cols-2">
        <DialogClose as-child>
          <MocaButton variant="secondary" block>취소</MocaButton>
        </DialogClose>
        <MocaButton block @click="confirmTurnOffLocation">끄기</MocaButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
