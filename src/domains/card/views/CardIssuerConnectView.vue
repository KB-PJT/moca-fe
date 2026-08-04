<script setup lang="ts">
import { CheckCircle2, LockKeyhole, ShieldCheck } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CardConnectionFieldGroup from '@/domains/card/components/CardConnectionFieldGroup.vue'
import CardIssuerIcon from '@/domains/card/components/CardIssuerIcon.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import {
  CARD_CONNECTION_CONFIGS,
  type CardConnectionField,
  type CardConnectionFieldKey,
} from '@/domains/card/constants/cardConnection'
import { CARD_ISSUERS, isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import MocaButton from '@/shared/components/MocaButton.vue'
import { Switch } from '@/shared/ui/switch'

interface CardConnectionSubmitPayload {
  issuerId: keyof typeof CARD_ISSUERS
  values: Partial<Record<CardConnectionFieldKey, string>>
  includeCardImages: boolean
}

const emit = defineEmits<{
  submit: [payload: CardConnectionSubmitPayload]
}>()

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()

function createEmptyValues(): Record<CardConnectionFieldKey, string> {
  return {
    homepageId: '',
    homepagePassword: '',
    cardNumber: '',
    cardPassword: '',
    birthDate: '',
  }
}

const formValues = ref(createEmptyValues())
const validationErrors = ref<Partial<Record<CardConnectionFieldKey, string>>>({})
const visiblePasswords = ref<Partial<Record<CardConnectionFieldKey, boolean>>>({})
const includeCardImages = ref(true)
const isSubmitting = ref(false)

// SECURITY(NOW): 민감정보는 이 화면의 메모리에서만 관리하며 저장소·전역 상태·로그에 남기지 않는다.

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId

  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})

const issuer = computed(() => (issuerId.value ? CARD_ISSUERS[issuerId.value] : null))
const connectionConfig = computed(() =>
  issuerId.value ? CARD_CONNECTION_CONFIGS[issuerId.value] : null,
)
const loginFields = computed(() => connectionConfig.value?.loginFields ?? [])
const additionalFields = computed(() => connectionConfig.value?.additionalFields ?? [])
const visibleFields = computed(() => [...loginFields.value, ...additionalFields.value])
const hasAdditionalInfo = computed(() => connectionConfig.value?.additionalInputMode === 'always')
const canConnect = computed(
  () =>
    visibleFields.value.length > 0 &&
    visibleFields.value.every((field) => isFieldValid(field, formValues.value[field.key])),
)

function resetForm() {
  formValues.value = createEmptyValues()
  validationErrors.value = {}
  visiblePasswords.value = {}
  includeCardImages.value = true
  isSubmitting.value = false
}

function sanitizeFieldValue(field: CardConnectionField, value: string | number) {
  const stringValue = String(value)
  const sanitizedValue = field.numeric ? stringValue.replace(/\D/g, '') : stringValue

  return field.maxLength ? sanitizedValue.slice(0, field.maxLength) : sanitizedValue
}

function updateFieldValue(field: CardConnectionField, value: string | number) {
  formValues.value[field.key] = sanitizeFieldValue(field, value)
  if (validationErrors.value[field.key]) validateField(field)
}

function isFieldValid(field: CardConnectionField, value: string) {
  if (value.trim().length === 0) return false
  if (field.exactLength && value.length !== field.exactLength) return false
  return true
}

function validateField(field: CardConnectionField) {
  const value = formValues.value[field.key]
  let error = ''

  if (value.trim().length === 0) {
    error = `${field.label}을(를) 입력해 주세요`
  } else if (field.exactLength && value.length !== field.exactLength) {
    error = `${field.label}은(는) ${field.exactLength}자리로 입력해 주세요`
  }

  validationErrors.value = {
    ...validationErrors.value,
    [field.key]: error,
  }
}

function togglePasswordVisibility(fieldKey: CardConnectionFieldKey) {
  visiblePasswords.value = {
    ...visiblePasswords.value,
    [fieldKey]: !visiblePasswords.value[fieldKey],
  }
}

function connectIssuer() {
  if (!issuerId.value || !canConnect.value || isSubmitting.value) return

  isSubmitting.value = true

  const values = Object.fromEntries(
    visibleFields.value.map((field) => [field.key, formValues.value[field.key]]),
  ) as Partial<Record<CardConnectionFieldKey, string>>

  emit('submit', {
    issuerId: issuerId.value,
    values,
    includeCardImages: includeCardImages.value,
  })

  // TODO(#46, AUTH): MOCA access token 발급·갱신이 연결되면 buildCreateCardLinkRequest로
  // 요청을 만들고 createCardLink를 호출한다. 자격정보는 store·브라우저 저장소·로그에 남기지 않는다.
  directCardConnectionStore.beginLookup(issuerId.value, includeCardImages.value)
  void router
    .push({
      name: 'card-issuer-connect-progress',
      params: { issuerId: issuerId.value },
    })
    .catch(() => {
      directCardConnectionStore.reset()
      isSubmitting.value = false
    })
}

function returnToIssuerSelection() {
  void router.replace({ name: 'card-issuer-select' })
}

watch(issuerId, resetForm)
onBeforeUnmount(resetForm)
</script>

<template>
  <CardPageLayout title="카드 등록" bg="background">
    <template v-if="issuer && connectionConfig">
      <section class="-mx-5 -mt-6 flex items-center gap-3 border-b border-divider px-5 py-4">
        <CardIssuerIcon :issuer="issuer.id" variant="fill" />
        <div>
          <h1 class="text-subheading text-charcoal">{{ issuer.name }}</h1>
          <p class="mt-0.5 text-caption text-gray">
            카드사 정보를 입력하고 보유 카드를 조회해보세요
          </p>
        </div>
      </section>

      <!-- API 연동 완료 후 HTTPS 전송과 서버 측 민감정보 보호가 적용된 상태를 안내하는 문구 -->
      <section class="mt-3 flex gap-2 rounded-md bg-[#fbf6f0] px-3 py-3 text-[#a67c52]">
        <LockKeyhole class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p class="text-caption leading-5">
          입력한 정보는 카드 조회 및 본인 인증에만 사용되며 암호화되어 안전하게 전송돼요
        </p>
      </section>

      <form id="card-issuer-connect-form" class="mt-5" @submit.prevent="connectIssuer">
        <CardConnectionFieldGroup
          title="카드사 로그인 정보"
          :fields="loginFields"
          :values="formValues"
          :errors="validationErrors"
          :visible-passwords="visiblePasswords"
          @update="updateFieldValue"
          @blur="validateField"
          @toggle-password="togglePasswordVisibility"
        />

        <CardConnectionFieldGroup
          v-if="hasAdditionalInfo"
          title="추가 인증 정보"
          class="mt-5"
          :fields="additionalFields"
          :values="formValues"
          :errors="validationErrors"
          :visible-passwords="visiblePasswords"
          @update="updateFieldValue"
          @blur="validateField"
          @toggle-password="togglePasswordVisibility"
        />

        <section
          v-else-if="connectionConfig.additionalInputMode === 'none'"
          class="mt-5 rounded-md border border-success/20 bg-success/5 px-4 py-3"
        >
          <div class="flex gap-2 text-success">
            <CheckCircle2 class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <h2 class="text-body font-semibold">추가 인증 정보 없이 조회할 수 있어요</h2>
              <p class="mt-1 text-caption leading-5 text-gray">
                {{ issuer.name }} 로그인 정보만으로 보유 카드를 조회할 수 있어요
              </p>
            </div>
          </div>
        </section>

        <section
          class="mt-4 flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 shadow-tile"
        >
          <div>
            <h2 class="text-body font-semibold text-charcoal">카드 이미지 함께 불러오기</h2>
            <p class="mt-1 text-caption text-gray">카드사에서 이미지가 제공되면 함께 등록해요</p>
          </div>
          <Switch
            v-model="includeCardImages"
            class="h-6 w-10 [&_[data-slot=switch-thumb]]:size-5"
            aria-label="카드 이미지 함께 불러오기"
          />
        </section>
      </form>
    </template>

    <section v-else class="mt-20 text-center">
      <h1 class="text-subheading text-charcoal">카드사 정보를 찾을 수 없어요</h1>
      <p class="mt-2 text-body text-gray">카드사를 다시 선택해 주세요</p>
      <MocaButton class="mt-6 h-12 px-6" @click="returnToIssuerSelection">
        카드사 선택하기
      </MocaButton>
    </section>

    <template v-if="issuer" #footer>
      <div class="flex flex-col items-center">
        <MocaButton
          block
          type="button"
          :disabled="!canConnect"
          :loading="isSubmitting"
          class="h-14 text-subheading!"
          @click="connectIssuer"
        >
          보유카드 조회하기
        </MocaButton>
        <p class="mt-2 flex items-center gap-1 text-micro font-normal text-gray">
          <ShieldCheck class="size-3" aria-hidden="true" />
          카드 정보는 암호화되어 안전하게 처리돼요
        </p>
      </div>
    </template>
  </CardPageLayout>
</template>
