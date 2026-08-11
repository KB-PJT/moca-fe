<script setup lang="ts">
import {
  Bell,
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Pencil,
} from '@lucide/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logoutFromMoca } from '@/domains/auth/api/auth'
import { fetchMyPageSummary, updateLocationPermissionGranted } from '@/domains/mypage/api/mypage'
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
const isLocationOffConfirmOpen = ref(false)
const locationPermissionError = ref('')
const isInquiryToastVisible = ref(false)
let inquiryToastTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (!window.history.state?.inquirySubmitted) return

  isInquiryToastVisible.value = true

  const nextState = { ...window.history.state }
  delete nextState.inquirySubmitted
  window.history.replaceState(nextState, '')

  inquiryToastTimer = setTimeout(() => {
    isInquiryToastVisible.value = false
  }, 2000)
})

onBeforeUnmount(() => {
  if (inquiryToastTimer) clearTimeout(inquiryToastTimer)
})

const { data: summary } = useQuery({
  queryKey: ['mypage', 'summary'],
  queryFn: fetchMyPageSummary,
})

const { mutateAsync: updateLocationPermission, isPending: isLocationPermissionUpdating } =
  useMutation({
    mutationFn: updateLocationPermissionGranted,
    onSuccess: (updatedSummary) => {
      queryClient.setQueryData(['mypage', 'summary'], updatedSummary)
    },
  })

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const connectedCardDescription = computed(
  () => `등록한 카드 ${summary.value?.connectedCardCount ?? 0}개`,
)
const locationPermissionGranted = computed(() => summary.value?.locationPermissionGranted ?? false)

function navigateToCardManage() {
  void router.push({ name: 'card-manage', query: { from: 'mypage' } })
}

function navigateToProfile() {
  void router.push({ name: 'mypage-profile' })
}

function navigateToNotificationSettings() {
  void router.push({ name: 'notification-settings' })
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
      return
    }

    await updateLocationPermission(true)
    return
  }

  isLocationOffConfirmOpen.value = true
}

async function confirmTurnOffLocation() {
  isLocationOffConfirmOpen.value = false
  await updateLocationPermission(false)
}

async function handleLogout() {
  try {
    await logoutFromMoca()
  } finally {
    authStore.clearSession()
    isLogoutDialogOpen.value = false
    await router.replace({ name: 'login' })
  }
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
      v-if="isInquiryToastVisible"
      role="status"
      class="absolute top-[max(1rem,var(--safe-area-top))] right-5 left-5 z-50 rounded-md border bg-background px-4 py-3 text-center text-body font-semibold text-muted-foreground shadow-lg"
    >
      문의가 접수되었습니다.
    </div>
  </Transition>

  <PageLayout hide-app-bar has-bottom-bar>
    <MainHeader title="마이" />

    <section
      aria-labelledby="mypage-profile-heading"
      class="mb-6 w-full rounded-lg border border-divider/50 bg-card p-5 shadow-card"
    >
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
            class="flex size-7 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
            aria-hidden="true"
          >
            <Pencil class="size-4" />
          </span>
        </button>
      </div>
      <span class="mt-1 block text-caption font-semibold text-gray"> Google 계정으로 이용 중 </span>
      <span class="mt-2 flex items-center gap-1 text-label text-primary">
        <CreditCard class="size-3" />
        연결 카드 {{ summary?.connectedCardCount ?? 0 }}개
      </span>
    </section>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">내 서비스 관리</h2>
    <SectionCard
      flush
      class="overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
    >
      <ListItem
        title="내 카드 관리"
        :description="connectedCardDescription"
        clickable
        @click="navigateToCardManage"
      >
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <CreditCard class="size-4" />
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
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <Bell class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem
        title="위치 권한 설정"
        :description="
          locationPermissionError || (locationPermissionGranted ? '허용됨' : '허용 안 됨')
        "
      >
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <MapPin class="size-4" />
          </span>
        </template>
        <template #right>
          <Switch
            :model-value="locationPermissionGranted"
            :disabled="isLocationPermissionUpdating"
            class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
            aria-label="위치 권한 설정"
            @update:model-value="handleLocationPermissionChange"
          />
        </template>
      </ListItem>
    </SectionCard>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">고객지원</h2>
    <SectionCard
      flush
      class="overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
    >
      <ListItem title="공지사항" clickable @click="navigateToNotices">
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <Megaphone class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem title="문의하기" clickable @click="navigateToInquiry">
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <MessageSquare class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>
    </SectionCard>

    <h2 class="mb-2 px-1 text-body font-semibold text-gray">계정 관리</h2>
    <SectionCard
      flush
      class="overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
    >
      <ListItem title="로그아웃" clickable @click="isLogoutDialogOpen = true">
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
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
        <MocaButton block @click="handleLogout">로그아웃</MocaButton>
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
