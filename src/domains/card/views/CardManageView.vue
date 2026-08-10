<script setup lang="ts">
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  LoaderCircle,
  Plus,
  RotateCw,
  Trash2,
} from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activateCardLinkCards, syncCardLinkCards } from '@/domains/card/api/cardLinks'
import {
  deactivateMyCard,
  disconnectMyCard,
  fetchMyCards,
  reorderMyCards,
} from '@/domains/card/api/cardManagement'
import { CARD_ISSUER_LIST } from '@/domains/card/constants/cardIssuers'
import { type ManagedCard, useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import { Skeleton } from '@/shared/ui/skeleton'

type CardManagementAction = 'deactivate' | 'disconnect'

interface PendingAction {
  type: CardManagementAction
  cardId: string
  cardName: string
}

const route = useRoute()
const router = useRouter()
const cardManagementStore = useCardManagementStore()
const directCardConnectionStore = useDirectCardConnectionStore()
const isCardsLoading = ref(true)
const isRefreshing = ref(false)
const cardsError = ref('')
const isReordering = ref(false)
const isSavingOrder = ref(false)
const orderSnapshot = ref<string[]>([])
const orderStatusMessage = ref('')
const draggingCardId = ref<string | null>(null)
const dragTargetCardId = ref<string | null>(null)
const isActionDialogOpen = ref(false)
const pendingAction = ref<PendingAction | null>(null)
const isActionLoading = ref(false)
const actionError = ref('')
const activatingCardId = ref<string | null>(null)
const activationError = ref('')
const isInactiveCardsExpanded = ref(true)

const activeBottomBarPath = computed(() => {
  const from = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from

  if (from === 'home') return '/home'
  if (from === 'mypage') return '/mypage'
  return undefined
})
const actionDialogTitle = computed(() => {
  if (!pendingAction.value) return ''

  return pendingAction.value.type === 'deactivate'
    ? '카드를 비활성화할까요?'
    : '카드 연결을 해제할까요?'
})
const actionDialogSubject = computed(() => pendingAction.value?.cardName ?? '')
const actionDialogDescription = computed(() =>
  pendingAction.value?.type === 'deactivate'
    ? '비활성화한 카드는 혜택과 실적 계산에서 제외돼요. 언제든 다시 활성화할 수 있어요.'
    : '연결을 해제하면 저장된 카드 정보가 삭제돼요. 다시 사용하려면 카드를 연결해야 해요.',
)
const actionDialogConfirmLabel = computed(() =>
  pendingAction.value?.type === 'deactivate' ? '비활성화' : '연결 해제',
)

async function loadCards(isRefresh = false) {
  if (isRefreshing.value || isReordering.value) return

  if (isRefresh) isRefreshing.value = true
  else isCardsLoading.value = true
  cardsError.value = ''

  try {
    const response = await fetchMyCards()
    cardManagementStore.setCards(response)
  } catch {
    cardsError.value = '보유카드를 불러오지 못했어요.'
  } finally {
    isRefreshing.value = false
    isCardsLoading.value = false
  }
}

function refreshCards() {
  void loadCards(true)
}

function startCardReordering() {
  orderSnapshot.value = cardManagementStore.activeCards.map((card) => card.id)
  orderStatusMessage.value = ''
  isReordering.value = true
}

function cancelCardReordering() {
  cardManagementStore.setActiveCardOrder(orderSnapshot.value)
  draggingCardId.value = null
  dragTargetCardId.value = null
  orderSnapshot.value = []
  orderStatusMessage.value = ''
  isReordering.value = false
}

async function saveCardOrder() {
  if (isSavingOrder.value) return

  isSavingOrder.value = true
  orderStatusMessage.value = ''

  try {
    const cardIds = cardManagementStore.activeCards.map((card) => card.id)
    const response = await reorderMyCards(cardIds)
    cardManagementStore.setCards(response)
    draggingCardId.value = null
    dragTargetCardId.value = null
    orderSnapshot.value = []
    isReordering.value = false
  } catch {
    cardManagementStore.setActiveCardOrder(orderSnapshot.value)
    orderStatusMessage.value = '카드 순서를 저장하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSavingOrder.value = false
  }
}

function moveCardToTarget() {
  if (!draggingCardId.value || !dragTargetCardId.value) return

  const targetIndex = cardManagementStore.activeCards.findIndex(
    (card) => card.id === dragTargetCardId.value,
  )
  cardManagementStore.moveActiveCardTo(draggingCardId.value, targetIndex)
}

function startNativeCardDrag(cardId: string, event: DragEvent) {
  if (!isReordering.value || isSavingOrder.value) return

  draggingCardId.value = cardId
  dragTargetCardId.value = cardId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', cardId)
  }
}

function setDragTarget(cardId: string) {
  if (!draggingCardId.value || draggingCardId.value === cardId) return
  dragTargetCardId.value = cardId
}

function dropNativeCard(targetCardId: string, event: DragEvent) {
  event.preventDefault()
  dragTargetCardId.value = targetCardId
  moveCardToTarget()
  draggingCardId.value = null
  dragTargetCardId.value = null
}

function finishNativeCardDrag() {
  draggingCardId.value = null
  dragTargetCardId.value = null
}

function startTouchCardDrag(cardId: string, event: PointerEvent) {
  if (!isReordering.value || isSavingOrder.value || event.pointerType === 'mouse') return

  event.preventDefault()
  draggingCardId.value = cardId
  dragTargetCardId.value = cardId

  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture?.(event.pointerId)
}

function moveTouchedCard(event: PointerEvent) {
  if (!draggingCardId.value) return

  event.preventDefault()
  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-card-id]')
  const targetCardId = target?.dataset.cardId
  if (targetCardId && targetCardId !== draggingCardId.value) dragTargetCardId.value = targetCardId
}

function finishTouchCardDrag(event: PointerEvent) {
  const handle = event.currentTarget as HTMLElement
  if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  moveCardToTarget()
  draggingCardId.value = null
  dragTargetCardId.value = null
}

function moveCardWithKeyboard(cardId: string, event: KeyboardEvent) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

  event.preventDefault()
  cardManagementStore.moveActiveCard(cardId, event.key === 'ArrowUp' ? -1 : 1)
}

function addCard() {
  void router.push({ name: 'card-connect' })
}

function requestCardAction(type: CardManagementAction, cardId: string, cardName: string) {
  pendingAction.value = { type, cardId, cardName }
  actionError.value = ''
  isActionDialogOpen.value = true
}

async function activateCard(card: ManagedCard) {
  if (activatingCardId.value || isActionLoading.value) return

  activatingCardId.value = card.id
  activationError.value = ''

  try {
    const issuer = CARD_ISSUER_LIST.find((item) => item.name === card.issuerName)
    const response = await syncCardLinkCards(issuer?.institutionCode)
    const result = response.results.find(
      (item) => item.success && item.cards.some((linkedCard) => linkedCard.userCardId === card.id),
    )
    const linkedCard = result?.cards.find((item) => item.userCardId === card.id)

    if (!result || !linkedCard) throw new Error('CARD_LINK_NOT_FOUND')

    if (linkedCard.optionGroups.length > 0) {
      const linkedIssuer = CARD_ISSUER_LIST.find(
        (item) => item.institutionCode === result.institutionCode,
      )
      if (!linkedIssuer) throw new Error('CARD_ISSUER_NOT_FOUND')

      directCardConnectionStore.beginLookup(linkedIssuer.id)
      directCardConnectionStore.completeCardLinkCards(
        result.linkId,
        result.institutionCode,
        result.cards,
      )
      directCardConnectionStore.setAllSelected(false)
      directCardConnectionStore.setCardSelected(card.id, true)
      await router.push({
        name: 'card-issuer-card-select',
        params: { issuerId: linkedIssuer.id },
      })
      return
    }

    await activateCardLinkCards(result.linkId, { activeUserCardIds: [card.id] })
    cardManagementStore.setCardActive(card.id, true)
  } catch {
    activationError.value = '카드를 활성화하지 못했어요. 다시 시도해 주세요.'
  } finally {
    activatingCardId.value = null
  }
}

function closeActionDialog() {
  if (isActionLoading.value) return

  isActionDialogOpen.value = false
  pendingAction.value = null
  actionError.value = ''
}

function updateActionDialogOpen(open: boolean) {
  if (!open && isActionLoading.value) return

  isActionDialogOpen.value = open

  if (!open) {
    void nextTick(() => {
      if (!isActionDialogOpen.value) pendingAction.value = null
    })
  }
}

async function confirmCardAction() {
  if (!pendingAction.value || isActionLoading.value) return

  const action = pendingAction.value
  isActionLoading.value = true
  actionError.value = ''
  let succeeded = false

  try {
    if (action.type === 'deactivate') {
      await deactivateMyCard(action.cardId)
      cardManagementStore.setCardActive(action.cardId, false)
    } else {
      await disconnectMyCard(action.cardId)
      cardManagementStore.disconnectCard(action.cardId)
    }
    succeeded = true
  } catch {
    actionError.value =
      action.type === 'deactivate'
        ? '카드를 비활성화하지 못했어요. 다시 시도해 주세요.'
        : '카드 연결을 해제하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isActionLoading.value = false
  }

  if (succeeded) closeActionDialog()
}

onBeforeUnmount(() => {
  draggingCardId.value = null
  dragTargetCardId.value = null
})

onMounted(() => {
  if (cardManagementStore.consumePreserveCardsOnNextLoad()) {
    isCardsLoading.value = false
    return
  }

  void loadCards()
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <div class="min-h-0 flex-1">
      <PageLayout title="내 카드 관리" has-bottom-bar>
        <div
          v-if="isCardsLoading"
          data-managed-cards-loading
          class="space-y-3"
          aria-label="보유카드 로딩 중"
        >
          <Skeleton class="h-32 w-full" />
          <Skeleton class="h-32 w-full" />
          <Skeleton class="h-32 w-full" />
        </div>

        <EmptyState
          v-else-if="cardsError && cardManagementStore.cards.length === 0"
          :title="cardsError"
          description="잠시 후 다시 시도해 주세요."
          action-label="다시 시도"
          @action="loadCards()"
        />

        <template v-else>
          <p
            v-if="cardsError"
            class="mb-3 rounded-md bg-error/8 px-4 py-3 text-caption text-error"
            role="alert"
          >
            {{ cardsError }} 기존 목록을 표시하고 있어요.
          </p>

          <section aria-labelledby="active-card-heading">
            <div class="mb-3 flex min-h-11 items-center justify-between">
              <h1 id="active-card-heading" class="text-caption text-gray">
                등록된 카드 {{ cardManagementStore.activeCards.length }}개
              </h1>
              <div v-if="isReordering" class="flex items-center text-caption font-semibold">
                <button
                  type="button"
                  class="flex h-11 min-w-12 items-center justify-center px-2 text-gray disabled:text-disabled"
                  :disabled="isSavingOrder"
                  @click="cancelCardReordering"
                >
                  취소
                </button>
                <button
                  type="button"
                  class="flex h-11 min-w-12 items-center justify-center gap-1 px-2 text-primary disabled:text-disabled"
                  :disabled="isSavingOrder"
                  @click="saveCardOrder"
                >
                  <LoaderCircle
                    v-if="isSavingOrder"
                    class="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {{ isSavingOrder ? '저장 중' : '저장' }}
                </button>
              </div>
              <div v-else class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-caption font-medium text-gray"
                  :disabled="cardManagementStore.activeCards.length < 2"
                  @click="startCardReordering"
                >
                  순서 변경
                </button>
                <button
                  type="button"
                  class="flex items-center gap-1 text-caption font-medium text-gray disabled:cursor-not-allowed"
                  :aria-label="isRefreshing ? '카드 목록 새로고침 중' : '카드 목록 새로고침'"
                  :disabled="isRefreshing"
                  @click="refreshCards"
                >
                  <LoaderCircle
                    v-if="isRefreshing"
                    class="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  <RotateCw v-else class="size-4" aria-hidden="true" />
                  {{ isRefreshing ? '새로고침 중' : '새로고침' }}
                </button>
              </div>
            </div>

            <p v-if="orderStatusMessage" class="mb-3 text-caption text-error" role="status">
              {{ orderStatusMessage }}
            </p>

            <ul v-if="cardManagementStore.activeCards.length" class="space-y-3">
              <li
                v-for="card in cardManagementStore.activeCards"
                :key="card.id"
                :data-card-id="card.id"
                :draggable="isReordering && !isSavingOrder"
                :class="isReordering ? 'cursor-grab select-none active:cursor-grabbing' : ''"
                @dragstart="startNativeCardDrag(card.id, $event)"
                @dragenter.prevent="setDragTarget(card.id)"
                @dragover.prevent="setDragTarget(card.id)"
                @drop="dropNativeCard(card.id, $event)"
                @dragend="finishNativeCardDrag"
              >
                <article
                  class="overflow-hidden rounded-md border border-divider bg-card"
                  :class="[
                    isReordering ? 'ring-1 ring-primary/30' : '',
                    draggingCardId === card.id ? 'scale-[0.99] opacity-60' : '',
                    dragTargetCardId === card.id && draggingCardId !== card.id
                      ? 'ring-2 ring-primary'
                      : '',
                  ]"
                >
                  <div class="flex min-h-20 items-center gap-4 px-4 py-4">
                    <button
                      v-if="isReordering"
                      type="button"
                      class="-ml-2 flex size-8 touch-none cursor-grab items-center justify-center text-gray active:cursor-grabbing"
                      :aria-label="`${card.name} 순서 이동`"
                      :aria-pressed="draggingCardId === card.id"
                      @pointerdown="startTouchCardDrag(card.id, $event)"
                      @pointermove="moveTouchedCard"
                      @pointerup="finishTouchCardDrag"
                      @pointercancel="finishTouchCardDrag"
                      @keydown="moveCardWithKeyboard(card.id, $event)"
                    >
                      <GripVertical class="size-5" aria-hidden="true" />
                    </button>
                    <CardImage
                      :src="card.imageUrl"
                      :alt="`${card.name} 카드 이미지`"
                      small
                      orientation="horizontal"
                      :width="72"
                      :height="44"
                      class="shrink-0 rounded-sm"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <h2 class="truncate text-subheading text-charcoal">{{ card.name }}</h2>
                        <span
                          class="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-micro text-emerald-600"
                        >
                          연결됨
                        </span>
                      </div>
                      <p class="mt-1 text-caption text-gray">
                        {{ card.issuerName }} ·
                        {{ card.cardNo || '카드번호 미제공' }}
                      </p>
                    </div>
                  </div>

                  <div v-if="!isReordering" class="grid h-11 grid-cols-2 border-t border-divider">
                    <button
                      type="button"
                      class="flex items-center justify-center gap-1.5 border-r border-divider text-body font-medium text-gray"
                      :aria-label="`${card.name} 비활성화`"
                      @click="requestCardAction('deactivate', card.id, card.name)"
                    >
                      <EyeOff class="size-4" aria-hidden="true" />
                      비활성화
                    </button>
                    <button
                      type="button"
                      class="flex items-center justify-center gap-1.5 text-body font-medium text-rose-500"
                      :aria-label="`${card.name} 연결 해제`"
                      @click="requestCardAction('disconnect', card.id, card.name)"
                    >
                      <Trash2 class="size-4" aria-hidden="true" />
                      연결 해제
                    </button>
                  </div>
                </article>
              </li>
            </ul>

            <p v-else class="rounded-md bg-screen px-4 py-8 text-center text-body text-gray">
              등록된 카드가 없어요
            </p>
          </section>

          <section data-inactive-card-section class="mt-8" aria-labelledby="inactive-card-heading">
            <h2 id="inactive-card-heading" class="mb-3">
              <button
                type="button"
                class="flex min-h-11 w-full items-center justify-between text-left text-caption text-gray"
                :aria-expanded="isInactiveCardsExpanded"
                aria-controls="inactive-card-list"
                :aria-label="`비활성 카드 ${isInactiveCardsExpanded ? '접기' : '펼치기'}`"
                @click="isInactiveCardsExpanded = !isInactiveCardsExpanded"
              >
                <span>비활성화 된 카드 {{ cardManagementStore.inactiveCards.length }}개</span>
                <ChevronDown
                  class="size-4 transition-transform duration-200"
                  :class="isInactiveCardsExpanded ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>
            </h2>

            <p v-if="activationError" class="mb-3 text-caption text-rose-500" role="alert">
              {{ activationError }}
            </p>

            <ul
              v-if="cardManagementStore.inactiveCards.length && isInactiveCardsExpanded"
              id="inactive-card-list"
              class="space-y-3"
            >
              <li v-for="card in cardManagementStore.inactiveCards" :key="card.id">
                <article
                  data-inactive-card
                  class="overflow-hidden rounded-md border border-divider bg-screen"
                >
                  <div
                    data-inactive-card-summary
                    class="flex min-h-20 items-center gap-4 px-4 py-4 opacity-60"
                  >
                    <CardImage
                      :src="card.imageUrl"
                      :alt="`${card.name} 카드 이미지`"
                      small
                      orientation="horizontal"
                      :width="72"
                      :height="44"
                      class="shrink-0 rounded-sm"
                    />
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate text-subheading text-charcoal">{{ card.name }}</h3>
                      <p class="mt-1 text-caption text-gray">
                        {{ card.issuerName }} ·
                        {{ card.cardNo || '카드번호 미제공' }}
                      </p>
                    </div>
                  </div>

                  <div class="grid h-11 grid-cols-2 border-t border-divider">
                    <button
                      type="button"
                      class="flex items-center justify-center gap-1.5 border-r border-divider text-body font-medium text-gray disabled:cursor-not-allowed disabled:opacity-50"
                      :aria-label="`${card.name} 활성화`"
                      :disabled="Boolean(activatingCardId)"
                      @click="activateCard(card)"
                    >
                      <LoaderCircle
                        v-if="activatingCardId === card.id"
                        class="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      <Eye v-else class="size-4" aria-hidden="true" />
                      {{ activatingCardId === card.id ? '활성화 중' : '활성화' }}
                    </button>
                    <button
                      type="button"
                      class="flex items-center justify-center gap-1.5 text-body font-medium text-rose-500"
                      :aria-label="`${card.name} 연결 해제`"
                      @click="requestCardAction('disconnect', card.id, card.name)"
                    >
                      <Trash2 class="size-4" aria-hidden="true" />
                      연결 해제
                    </button>
                  </div>
                </article>
              </li>
            </ul>
          </section>
        </template>

        <template #footer>
          <MocaButton
            variant="secondary"
            block
            class="h-14 rounded-md text-subheading!"
            @click="addCard"
          >
            <Plus class="size-5" aria-hidden="true" />
            카드 추가하기
          </MocaButton>
        </template>
      </PageLayout>
    </div>

    <BottomBar :active-path="activeBottomBarPath" />

    <ConfirmDialog
      v-if="pendingAction"
      :open="isActionDialogOpen"
      :subject="actionDialogSubject"
      :title="actionDialogTitle"
      :description="actionDialogDescription"
      :confirm-label="actionDialogConfirmLabel"
      :destructive="pendingAction.type === 'disconnect'"
      :loading="isActionLoading"
      :error-message="actionError"
      @update:open="updateActionDialogOpen"
      @cancel="closeActionDialog"
      @confirm="confirmCardAction"
    />
  </div>
</template>
