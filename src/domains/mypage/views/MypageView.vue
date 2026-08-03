<script setup lang="ts">
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Pencil,
  RefreshCw,
} from '@lucide/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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
const locationPermissionError = ref('')

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
  }

  await updateLocationPermission(enabled)
}

function handleLogout() {
  authStore.clearSession()
  isLogoutDialogOpen.value = false
  void router.push({ name: 'login' })
}
</script>

<template>
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
      <span class="mt-2 flex items-center gap-3 text-label">
        <span class="flex items-center gap-1 text-primary">
          <CreditCard class="size-3" />
          연결 카드 {{ summary?.connectedCardCount ?? 0 }}개
        </span>
        <span class="ml-auto flex items-center gap-3">
          <span aria-hidden="true" class="text-disabled">·</span>
          <span class="flex items-center gap-1 text-gray">
            <RefreshCw class="size-3" />
            {{ summary?.lastSyncedAt || '동기화 전' }} 동기화
          </span>
        </span>
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
      <ListItem title="자주 묻는 질문" clickable>
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <CircleHelp class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem title="문의하기" clickable>
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <MessageSquare class="size-4" />
          </span>
        </template>
        <template #right><ChevronRight class="size-4 text-gray" /></template>
      </ListItem>

      <ListItem title="공지사항" clickable>
        <template #left>
          <span
            class="flex size-8 items-center justify-center rounded-full bg-[#F0EDFE] text-primary"
          >
            <Megaphone class="size-4" />
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
      <button type="button" class="text-caption text-error underline underline-offset-4">
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
</template>
