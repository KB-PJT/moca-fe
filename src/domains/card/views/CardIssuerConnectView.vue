<script setup lang="ts">
import { CheckCircle2, CircleAlert, LoaderCircle, LockKeyhole, ShieldCheck } from '@lucide/vue'
import axios from 'axios'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createCardLink,
  discoverCardLinkCards,
  syncCardLinkCards,
  type CardLinkErrorResponse,
} from '@/domains/card/api/cardLinks'
import { buildCreateCardLinkRequest } from '@/domains/card/api/cardLinkPayload'
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
const isSubmitting = ref(false)
const connectionState = ref<'checking' | 'unlinked' | 'failed'>('checking')

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

async function connectIssuer() {
  if (
    !issuerId.value ||
    connectionState.value !== 'unlinked' ||
    !canConnect.value ||
    isSubmitting.value
  )
    return

  const targetIssuerId = issuerId.value
  isSubmitting.value = true

  const values = Object.fromEntries(
    visibleFields.value.map((field) => [field.key, formValues.value[field.key]]),
  ) as Partial<Record<CardConnectionFieldKey, string>>
  const request = buildCreateCardLinkRequest(targetIssuerId, values)

  directCardConnectionStore.beginLookup(targetIssuerId)

  try {
    await router.push({
      name: 'card-issuer-connect-progress',
      params: { issuerId: targetIssuerId },
    })
  } catch {
    directCardConnectionStore.reset()
    isSubmitting.value = false
    return
  }

  try {
    const createdLink = await createCardLink(request)
    const response = request.cardNo ? await discoverCardLinkCards(createdLink.linkId) : createdLink
    if (directCardConnectionStore.issuerId === targetIssuerId) {
      directCardConnectionStore.completeCardLink(response)
    }
  } catch (error) {
    if (directCardConnectionStore.issuerId === targetIssuerId) {
      directCardConnectionStore.failLookup(toLookupError(error))
    }
  } finally {
    isSubmitting.value = false
  }
}

async function syncExistingLink(targetIssuerId: typeof issuerId.value) {
  if (!targetIssuerId) return

  connectionState.value = 'checking'
  const institutionCode = CARD_ISSUERS[targetIssuerId].institutionCode

  try {
    const response = await syncCardLinkCards(institutionCode)
    if (issuerId.value !== targetIssuerId) return

    const result = response.results.find((item) => item.institutionCode === institutionCode)
    if (!result?.success) {
      throw new Error('CARD_LINK_SYNC_FAILED')
    }

    directCardConnectionStore.beginLookup(targetIssuerId)
    await router.push({
      name: 'card-issuer-connect-progress',
      params: { issuerId: targetIssuerId },
    })

    if (directCardConnectionStore.issuerId === targetIssuerId) {
      directCardConnectionStore.completeCardLinkCards(
        result.linkId,
        result.institutionCode,
        result.cards,
      )
    }
  } catch (error) {
    if (issuerId.value !== targetIssuerId) return
    connectionState.value = isConnectionNotFound(error) ? 'unlinked' : 'failed'
  }
}

function retryLinkCheck() {
  void syncExistingLink(issuerId.value)
}

function isConnectionNotFound(error: unknown) {
  return (
    axios.isAxiosError<CardLinkErrorResponse>(error) &&
    error.response?.status === 404 &&
    error.response.data?.error.code === 'CODEF_CONNECTION_NOT_FOUND'
  )
}

function toLookupError(error: unknown) {
  if (axios.isAxiosError<CardLinkErrorResponse>(error)) {
    const apiError = error.response?.data?.error
    if (apiError) {
      return {
        code: apiError.code,
        message: apiError.message,
        fields: apiError.fields,
      }
    }
  }

  return { message: '카드사 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
}

function returnToIssuerSelection() {
  directCardConnectionStore.reset()
  void router.replace({ name: 'card-issuer-select' })
}

watch(
  issuerId,
  (targetIssuerId) => {
    resetForm()
    if (targetIssuerId) void syncExistingLink(targetIssuerId)
  },
  { immediate: true },
)
onBeforeUnmount(resetForm)
</script>

<template>
  <CardPageLayout title="카드 등록" bg="background" @back="returnToIssuerSelection">
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

      <section
        v-if="connectionState === 'checking'"
        class="flex min-h-72 flex-col items-center justify-center text-center"
        aria-live="polite"
      >
        <LoaderCircle class="size-8 animate-spin text-brown" aria-hidden="true" />
        <h2 class="mt-5 text-subheading text-charcoal">연동된 보유카드를 확인하고 있어요</h2>
        <p class="mt-2 text-body text-gray">잠시만 기다려 주세요</p>
      </section>

      <section
        v-else-if="connectionState === 'failed'"
        class="flex min-h-72 flex-col items-center justify-center text-center"
        role="alert"
      >
        <div class="flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
          <CircleAlert class="size-8" aria-hidden="true" />
        </div>
        <h2 class="mt-5 text-subheading text-charcoal">연동 상태를 확인하지 못했어요</h2>
        <p class="mt-2 text-body text-gray">잠시 후 다시 시도해 주세요</p>
        <MocaButton class="mt-6 h-12 px-8" @click="retryLinkCheck">다시 시도하기</MocaButton>
      </section>

      <template v-else>
        <!-- 민감정보는 이 화면의 메모리에서만 관리하고 HTTPS로 전송한다. -->
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
        </form>
      </template>
    </template>

    <section v-else class="mt-20 text-center">
      <h1 class="text-subheading text-charcoal">카드사 정보를 찾을 수 없어요</h1>
      <p class="mt-2 text-body text-gray">카드사를 다시 선택해 주세요</p>
      <MocaButton class="mt-6 h-12 px-6" @click="returnToIssuerSelection">
        카드사 선택하기
      </MocaButton>
    </section>

    <template v-if="issuer && connectionState === 'unlinked'" #footer>
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
