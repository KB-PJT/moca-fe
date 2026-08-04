<script setup lang="ts">
import { Eye, EyeOff, GripVertical, LoaderCircle, Plus, RotateCw, Trash2 } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { updateManagedCardOrder } from '@/domains/card/api/cardManagement.mock'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

const REFRESH_DURATION_MS = 700

type CardManagementAction = 'deactivate' | 'disconnect'

interface PendingAction {
  type: CardManagementAction
  cardId: string
  cardName: string
}

const route = useRoute()
const router = useRouter()
const cardManagementStore = useCardManagementStore()
const isRefreshing = ref(false)
const isReordering = ref(false)
const isSavingOrder = ref(false)
const orderSnapshot = ref<string[]>([])
const orderStatusMessage = ref('')
const draggingCardId = ref<string | null>(null)
const dragTargetCardId = ref<string | null>(null)
const isActionDialogOpen = ref(false)
const pendingAction = ref<PendingAction | null>(null)
let refreshTimer: ReturnType<typeof setTimeout> | undefined

const activeBottomBarPath = computed(() => {
  const from = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from

  if (from === 'home') return '/home'
  if (from === 'mypage') return '/mypage'
  return undefined
})
const actionDialogTitle = computed(() => {
  if (!pendingAction.value) return ''

  return pendingAction.value.type === 'deactivate'
    ? `${pendingAction.value.cardName} 카드를 비활성화할까요?`
    : `${pendingAction.value.cardName} 카드 연결을 해제할까요?`
})
const actionDialogDescription = computed(() =>
  pendingAction.value?.type === 'deactivate'
    ? '비활성화한 카드는 혜택과 실적 계산에서 제외돼요. 언제든 다시 활성화할 수 있어요.'
    : '연결을 해제하면 저장된 카드 정보가 삭제돼요. 다시 사용하려면 카드를 연결해야 해요.',
)
const actionDialogConfirmLabel = computed(() =>
  pendingAction.value?.type === 'deactivate' ? '비활성화' : '연결 해제',
)

function refreshCards() {
  if (isRefreshing.value || isReordering.value) return

  isRefreshing.value = true
  refreshTimer = setTimeout(() => {
    cardManagementStore.reset()
    isRefreshing.value = false
    refreshTimer = undefined
  }, REFRESH_DURATION_MS)
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
    await updateManagedCardOrder(cardIds)
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
  isActionDialogOpen.value = true
}

function closeActionDialog() {
  isActionDialogOpen.value = false
  pendingAction.value = null
}

function updateActionDialogOpen(open: boolean) {
  isActionDialogOpen.value = open

  if (!open) {
    void nextTick(() => {
      if (!isActionDialogOpen.value) pendingAction.value = null
    })
  }
}

function confirmCardAction() {
  if (!pendingAction.value) return

  if (pendingAction.value.type === 'deactivate') {
    cardManagementStore.setCardActive(pendingAction.value.cardId, false)
  } else {
    cardManagementStore.disconnectCard(pendingAction.value.cardId)
  }

  closeActionDialog()
}

onBeforeUnmount(() => {
  draggingCardId.value = null
  dragTargetCardId.value = null
  if (refreshTimer) clearTimeout(refreshTimer)
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <div class="min-h-0 flex-1">
      <PageLayout title="내 카드 관리" has-bottom-bar>
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
                <LoaderCircle v-if="isRefreshing" class="size-4 animate-spin" aria-hidden="true" />
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
                class="overflow-hidden rounded-md bg-card shadow-card transition-shadow"
                :class="[
                  isReordering ? 'ring-1 ring-primary/30' : '',
                  draggingCardId === card.id ? 'scale-[0.99] opacity-60 shadow-modal' : '',
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
                    class="shrink-0 rounded-sm shadow-tile"
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
                      {{ card.issuerName }} · •••• {{ card.last4 }}
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

        <section class="mt-18" aria-labelledby="inactive-card-heading">
          <h2 id="inactive-card-heading" class="mb-3 text-caption text-gray">
            비활성화 된 카드 {{ cardManagementStore.inactiveCards.length }}개
          </h2>

          <ul v-if="cardManagementStore.inactiveCards.length" class="space-y-3">
            <li v-for="card in cardManagementStore.inactiveCards" :key="card.id">
              <article class="overflow-hidden rounded-md bg-screen shadow-card">
                <div class="flex min-h-20 items-center gap-4 px-4 py-4">
                  <CardImage
                    :src="card.imageUrl"
                    :alt="`${card.name} 카드 이미지`"
                    small
                    orientation="horizontal"
                    :width="72"
                    :height="44"
                    class="shrink-0 rounded-sm opacity-85 shadow-tile"
                  />
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-subheading text-charcoal">{{ card.name }}</h3>
                    <p class="mt-1 text-caption text-gray">
                      {{ card.issuerName }} · •••• {{ card.last4 }}
                    </p>
                  </div>
                </div>

                <div class="grid h-11 grid-cols-2 border-t border-divider">
                  <button
                    type="button"
                    class="flex items-center justify-center gap-1.5 border-r border-divider text-body font-medium text-gray"
                    :aria-label="`${card.name} 활성화`"
                    @click="cardManagementStore.setCardActive(card.id, true)"
                  >
                    <Eye class="size-4" aria-hidden="true" />
                    활성화
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
      :title="actionDialogTitle"
      :description="actionDialogDescription"
      :confirm-label="actionDialogConfirmLabel"
      :destructive="pendingAction.type === 'disconnect'"
      @update:open="updateActionDialogOpen"
      @cancel="closeActionDialog"
      @confirm="confirmCardAction"
    />
  </div>
</template>
