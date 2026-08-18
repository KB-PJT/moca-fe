<script setup lang="ts">
import { LockKeyhole } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import googleLogo from '@/domains/auth/assets/google-logo.svg'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { updateNickname } from '@/domains/mypage/api/mypage'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const nickname = ref(authStore.user?.nickname ?? '')
const isSaving = ref(false)
const saveError = ref('')
const MAX_NICKNAME_LENGTH = 50

const email = computed(() => authStore.user?.email ?? '')
const normalizedNickname = computed(() => nickname.value.trim())
const nicknameLength = computed(() => Array.from(nickname.value).length)
const isNicknameTooLong = computed(() => nicknameLength.value > MAX_NICKNAME_LENGTH)
const isSaveDisabled = computed(
  () =>
    isSaving.value ||
    !normalizedNickname.value ||
    isNicknameTooLong.value ||
    normalizedNickname.value === authStore.user?.nickname,
)

function syncNickname(event: Event) {
  nickname.value = (event.target as HTMLInputElement).value
}

async function saveProfile() {
  if (!normalizedNickname.value || isNicknameTooLong.value || isSaveDisabled.value) return

  isSaving.value = true
  saveError.value = ''

  try {
    const updatedNickname = await updateNickname(normalizedNickname.value)
    authStore.updateNickname(updatedNickname)
    await router.push({ name: 'mypage' })
  } catch {
    saveError.value = '닉네임을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <PageLayout title="프로필 수정" has-bottom-bar>
    <form id="profile-edit-form" class="-mt-2" @submit.prevent="saveProfile">
      <div>
        <label for="nickname" class="text-caption mb-2 block font-bold text-[#8C7F74]">
          닉네임
        </label>
        <input
          id="nickname"
          v-model="nickname"
          name="nickname"
          type="text"
          autocomplete="nickname"
          @input="syncNickname"
          :aria-invalid="isNicknameTooLong"
          class="text-body h-12.5 w-full rounded-md border bg-card px-4 font-semibold text-charcoal outline-none transition-shadow focus:ring-3"
          :class="
            isNicknameTooLong
              ? 'border-error focus:border-error focus:ring-error/15'
              : 'border-black/8 focus:border-primary focus:ring-primary/15'
          "
          aria-describedby="nickname-help"
        />
        <div id="nickname-help" class="mt-1.5 flex min-h-4 items-start justify-between gap-3 px-1">
          <span class="text-caption text-error">
            {{ isNicknameTooLong ? '닉네임은 최대 50자까지 입력할 수 있어요.' : saveError }}
          </span>
          <span
            class="text-caption ml-auto shrink-0"
            :class="isNicknameTooLong ? 'text-error' : 'text-gray'"
          >
            {{ nicknameLength }}/{{ MAX_NICKNAME_LENGTH }}
          </span>
        </div>
      </div>

      <section class="mt-5" aria-labelledby="connected-account-title">
        <h2 id="connected-account-title" class="text-caption mb-2 font-bold text-[#8C7F74]">
          연결된 계정
        </h2>
        <div class="flex min-h-15.75 items-center gap-3 rounded-md bg-screen px-4 py-3.5">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full bg-card"
            aria-hidden="true"
          >
            <img :src="googleLogo" alt="" class="size-3.5" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="text-body block truncate font-semibold text-charcoal">
              {{ email }}
            </strong>
            <span class="text-micro block font-normal text-[#8C7F74]">
              Google 로그인 (변경 불가)
            </span>
          </span>
          <LockKeyhole class="size-3.5 shrink-0 text-[#8C7F74]" aria-hidden="true" />
        </div>
      </section>
    </form>

    <template #footer>
      <MocaButton
        form="profile-edit-form"
        type="submit"
        block
        :disabled="isSaveDisabled"
        class="h-13 rounded-md font-bold"
      >
        {{ isSaving ? '저장 중...' : '저장하기' }}
      </MocaButton>
    </template>
  </PageLayout>
</template>
