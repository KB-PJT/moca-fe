<script setup lang="ts">
import { CreditCard, ShieldCheck } from '@lucide/vue'
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  activateCardLinkCards,
  submitCardCredentials,
  type CardLinkErrorResponse,
  type SubmitCardCredentialsRequest,
} from '@/domains/card/api/cardLinks'
import {
  buildActivateCardLinkCardsRequest,
  CardLinkPayloadValidationError,
} from '@/domains/card/api/cardLinkPayload'
import CardCredentialDialog from '@/domains/card/components/CardCredentialDialog.vue'
import CardPageLayout from '@/domains/card/components/CardPageLayout.vue'
import { CARD_ISSUERS, isCardIssuerId } from '@/domains/card/constants/cardIssuers'
import {
  useDirectCardConnectionStore,
  type DiscoveredCard,
} from '@/domains/card/stores/directCardConnection'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import { Checkbox } from '@/shared/ui/checkbox'
import { formatCardNumber } from '@/shared/utils/format'

const route = useRoute()
const router = useRouter()
const directCardConnectionStore = useDirectCardConnectionStore()
const ownedCardsStore = useOwnedCardsStore()
const isSubmitting = ref(false)
const activationError = ref('')
const credentialCardIds = ref<string[]>([])
const credentialErrors = ref<Record<string, string>>({})
const isSubmittingCredentials = ref(false)

const issuerId = computed(() => {
  const routeIssuerId = route.params.issuerId
  const value = Array.isArray(routeIssuerId) ? routeIssuerId[0] : routeIssuerId
  return typeof value === 'string' && isCardIssuerId(value) ? value : null
})
const issuer = computed(() => (issuerId.value ? CARD_ISSUERS[issuerId.value] : null))
const selectedCount = computed(() => directCardConnectionStore.selectedCards.length)
const selectableCount = computed(() => directCardConnectionStore.selectableCards.length)
const isSelectionLocked = computed(
  () =>
    isSubmitting.value ||
    isSubmittingCredentials.value ||
    directCardConnectionStore.activationCompleted,
)
const credentialTargetCard = computed(() => {
  const userCardId = credentialCardIds.value[0]
  return userCardId
    ? (directCardConnectionStore.selectedCards.find((card) => card.userCardId === userCardId) ??
        null)
    : null
})
const hasIncompleteOptions = computed(
  () => selectedCount.value > 0 && !directCardConnectionStore.hasCompleteOptionSelections,
)
const allSelectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedCount.value === 0) return false
  if (selectedCount.value === selectableCount.value) return true
  return 'indeterminate'
})

function isCardSelectable(cardId: string) {
  return directCardConnectionStore.selectableCards.some((card) => card.id === cardId)
}

function isCardSelected(cardId: string) {
  return isCardSelectable(cardId) && directCardConnectionStore.selectedCardIds.includes(cardId)
}

function returnToIssuerForm() {
  directCardConnectionStore.reset()

  if (issuerId.value) {
    void router.replace({ name: 'card-issuer-connect', params: { issuerId: issuerId.value } })
  } else {
    void router.replace({ name: 'card-issuer-select' })
  }
}

function returnToIssuerSelect() {
  if (isSelectionLocked.value) return

  directCardConnectionStore.reset()
  void router.replace({ name: 'card-issuer-select' })
}

async function addSelectedCards() {
  const linkIdSnapshot = directCardConnectionStore.linkId
  const selectedCardsSnapshot = [...directCardConnectionStore.selectedCards]

  if (
    !issuerId.value ||
    !linkIdSnapshot ||
    selectedCardsSnapshot.length === 0 ||
    hasIncompleteOptions.value ||
    isSelectionLocked.value
  )
    return

  activationError.value = ''
  isSubmitting.value = true

  try {
    const request = buildActivateCardLinkCardsRequest(
      selectedCardsSnapshot,
      directCardConnectionStore.optionSelections,
    )
    const response = await activateCardLinkCards(linkIdSnapshot, request)
    const activatedIds = new Set(response.activatedUserCardIds)
    const activatedCards = selectedCardsSnapshot.filter(
      (card) => card.userCardId && activatedIds.has(card.userCardId),
    )

    if (activatedCards.length === 0) {
      activationError.value = '활성화된 카드가 없습니다. 다시 시도해 주세요.'
      return
    }

    directCardConnectionStore.completeActivation(response.activatedUserCardIds)
    ownedCardsStore.addOwnedCards(
      activatedCards.map(({ id, issuer: cardIssuer, name, last4, imageUrl }) => ({
        id,
        issuer: cardIssuer,
        name,
        last4,
        imageUrl,
      })),
    )
    await router.replace({
      name: 'card-issuer-sync-progress',
      params: { issuerId: issuerId.value },
    })
  } catch (error) {
    if (!prepareCredentialSubmission(error, selectedCardsSnapshot)) {
      activationError.value = toActivationErrorMessage(error)
    }
  } finally {
    isSubmitting.value = false
  }
}

function prepareCredentialSubmission(error: unknown, selectedCardsSnapshot: DiscoveredCard[]) {
  if (!axios.isAxiosError<CardLinkErrorResponse>(error)) return false

  const apiError = error.response?.data?.error
  if (apiError?.code !== 'CARD_CREDENTIAL_REQUIRED') return false

  const userCardIds = apiError.fields?.userCardId
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (!userCardIds?.length) return false

  const selectedUserCardIds = new Set(
    selectedCardsSnapshot.flatMap((card) => (card.userCardId ? [card.userCardId] : [])),
  )
  credentialCardIds.value = [...new Set(userCardIds)].filter((id) => selectedUserCardIds.has(id))
  credentialErrors.value = {}
  activationError.value = ''
  return credentialCardIds.value.length > 0
}

async function submitTargetCardCredentials(request: SubmitCardCredentialsRequest) {
  const target = credentialTargetCard.value
  if (!target?.userCardId || isSubmittingCredentials.value) return

  credentialErrors.value = {}
  isSubmittingCredentials.value = true
  let shouldRetryActivation = false

  try {
    const response = await submitCardCredentials(target.userCardId, request)
    directCardConnectionStore.updateCardLinkCard(response)
    credentialCardIds.value = credentialCardIds.value.filter((id) => id !== target.userCardId)
    shouldRetryActivation = credentialCardIds.value.length === 0
  } catch (error) {
    credentialErrors.value = toCredentialErrors(error)
  } finally {
    isSubmittingCredentials.value = false
  }

  if (shouldRetryActivation) await addSelectedCards()
}

function closeCredentialDialog() {
  if (isSubmittingCredentials.value) return
  credentialCardIds.value = []
  credentialErrors.value = {}
}

function toCredentialErrors(error: unknown) {
  if (axios.isAxiosError<CardLinkErrorResponse>(error)) {
    const apiError = error.response?.data?.error
    if (apiError?.fields && Object.keys(apiError.fields).length > 0) return apiError.fields
    if (apiError?.message) return { form: apiError.message }
  }

  return { form: '카드 정보 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
}

function toActivationErrorMessage(error: unknown) {
  if (error instanceof CardLinkPayloadValidationError) return error.message

  if (axios.isAxiosError<CardLinkErrorResponse>(error)) {
    return error.response?.data?.error.message ?? '카드 활성화 요청에 실패했습니다.'
  }

  return '카드 활성화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

onMounted(() => {
  if (
    !issuerId.value ||
    directCardConnectionStore.issuerId !== issuerId.value ||
    directCardConnectionStore.lookupStatus !== 'success'
  ) {
    returnToIssuerForm()
    return
  }

  if (directCardConnectionStore.activationCompleted) {
    void router.replace({
      name: 'card-issuer-sync-progress',
      params: { issuerId: issuerId.value },
    })
  }
})
</script>

<template>
  <CardPageLayout title="카드 등록" bg="screen" @back="returnToIssuerSelect">
    <template v-if="issuer">
      <section class="-mx-5 -mt-6 border-b border-divider bg-card px-5 py-4">
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <CreditCard class="size-3" />
          </span>
          <div>
            <h1 class="text-body font-semibold text-primary">보유 카드를 불러왔어요</h1>
            <p class="mt-1 text-caption text-gray">
              {{ issuer.name }}에서 {{ directCardConnectionStore.discoveredCards.length }}개 카드를
              찾았어요
            </p>
          </div>
        </div>
      </section>

      <section class="pt-4">
        <p class="text-caption text-gray">등록할 카드를 선택해 주세요</p>

        <div
          v-if="directCardConnectionStore.discoveredCards.length > 0"
          class="mt-2 overflow-hidden rounded-md bg-card shadow-tile"
        >
          <label
            class="flex h-12 items-center gap-3 border-b border-divider px-4"
            :class="isSelectionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'"
          >
            <Checkbox
              :model-value="allSelectionState"
              :disabled="isSelectionLocked"
              aria-label="전체 카드 선택"
              @update:model-value="
                !isSelectionLocked && directCardConnectionStore.setAllSelected($event === true)
              "
            />
            <span class="flex-1 text-body font-semibold text-charcoal">전체 선택</span>
            <span class="text-caption text-gray">{{ selectableCount }}개 선택 가능</span>
          </label>

          <ul aria-label="조회된 보유카드">
            <li
              v-for="card in directCardConnectionStore.discoveredCards"
              :key="card.id"
              class="border-b border-divider last:border-b-0"
            >
              <label
                class="flex min-h-18 items-center gap-3 px-4 py-3"
                :class="
                  isCardSelectable(card.id) && !isSelectionLocked
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-60'
                "
              >
                <CardImage
                  :src="card.imageUrl"
                  :alt="`${card.name} 카드 이미지`"
                  small
                  orientation="horizontal"
                  class="shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-body font-semibold text-charcoal">{{ card.name }}</p>
                  <p class="mt-0.5 text-caption text-gray">
                    {{ card.cardNo ?? formatCardNumber(card.last4) }}
                  </p>
                  <p v-if="card.matched === false" class="mt-1 text-micro text-error">
                    MOCA에서 지원하지 않는 카드예요
                  </p>
                  <p v-else-if="card.supported === false" class="mt-1 text-micro text-gray">
                    혜택 추천이 제한될 수 있어요
                  </p>
                </div>
                <Checkbox
                  :model-value="isCardSelected(card.id)"
                  :disabled="!isCardSelectable(card.id) || isSelectionLocked"
                  :aria-label="`${card.name} 선택`"
                  class="size-5 rounded-full"
                  @update:model-value="
                    !isSelectionLocked &&
                    directCardConnectionStore.setCardSelected(card.id, $event === true)
                  "
                />
              </label>

              <div
                v-if="isCardSelected(card.id) && card.optionGroups?.length"
                class="border-t border-divider bg-background px-4 py-4"
              >
                <p class="text-caption font-medium text-charcoal">카드 옵션을 선택해 주세요</p>
                <fieldset
                  v-for="group in card.optionGroups"
                  :key="group.optionGroupId"
                  class="mt-4 first:mt-3"
                >
                  <legend class="text-body font-semibold text-charcoal">
                    {{ group.groupName }}
                  </legend>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <label
                      v-for="choice in group.choices"
                      :key="choice.optionChoiceId"
                      class="cursor-pointer"
                    >
                      <input
                        type="radio"
                        class="peer sr-only"
                        :disabled="isSelectionLocked"
                        :name="`${card.id}-${group.optionGroupId}`"
                        :value="choice.optionChoiceId"
                        :checked="
                          directCardConnectionStore.optionSelections[card.id]?.[
                            group.optionGroupId
                          ] === choice.optionChoiceId
                        "
                        @change="
                          !isSelectionLocked &&
                          directCardConnectionStore.setOptionSelection(
                            card.id,
                            group.optionGroupId,
                            choice.optionChoiceId,
                          )
                        "
                      />
                      <span
                        class="flex min-h-10 items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-center text-caption text-gray transition-colors peer-checked:border-primary peer-checked:bg-primary/8 peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"
                      >
                        {{ choice.choiceName }}
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </li>
          </ul>
        </div>

        <div v-else class="mt-8 rounded-md bg-card px-5 py-10 text-center shadow-tile">
          <CreditCard class="mx-auto size-10 text-disabled" aria-hidden="true" />
          <h2 class="mt-4 text-subheading text-charcoal">추가할 카드가 없어요</h2>
          <p class="mt-2 text-body text-gray">해당 기관에서 새로 확인된 카드가 없습니다</p>
        </div>
      </section>
    </template>

    <template v-if="issuer" #footer>
      <div class="flex flex-col items-center">
        <p v-if="hasIncompleteOptions" class="mb-2 text-caption text-error" role="alert">
          선택한 카드의 옵션을 모두 골라 주세요
        </p>
        <p v-else-if="activationError" class="mb-2 text-caption text-error" role="alert">
          {{ activationError }}
        </p>
        <MocaButton
          block
          :disabled="selectedCount === 0 || hasIncompleteOptions || isSelectionLocked"
          :loading="isSubmitting"
          class="h-14 text-subheading!"
          @click="addSelectedCards"
        >
          선택한 카드 {{ selectedCount }}개 불러오기
        </MocaButton>
        <p class="mt-2 flex items-center gap-1 text-micro font-normal text-gray">
          <ShieldCheck class="size-3" aria-hidden="true" />
          카드 정보는 암호화되어 안전하게 처리돼요
        </p>
      </div>
    </template>

    <CardCredentialDialog
      v-if="credentialTargetCard"
      :key="credentialTargetCard.userCardId ?? credentialTargetCard.id"
      :open="true"
      :card-name="credentialTargetCard.name"
      :card-no="credentialTargetCard.cardNo"
      :errors="credentialErrors"
      :loading="isSubmittingCredentials"
      @update:open="(open) => !open && closeCredentialDialog()"
      @submit="submitTargetCardCredentials"
    />
  </CardPageLayout>
</template>
