<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import DOMPurify from 'dompurify'
import {
  Bus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  EllipsisVertical,
  EyeOff,
  Pencil,
  ShoppingBag,
  Store,
  Trash2,
} from '@lucide/vue'
import {
  fetchCardDetail,
  type CardDetailBenefitResponse,
  type CardDetailResponse,
  updateCardMemo,
} from '@/domains/card/api/cardDetail'
import { fetchMyCards } from '@/domains/card/api/cardManagement'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import AppBar from '@/shared/components/AppBar.vue'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import { Skeleton } from '@/shared/ui/skeleton'

const route = useRoute()
const router = useRouter()
const cardMemoStore = useCardMemoStore()
const cardManagementStore = useCardManagementStore()

type CardAction = 'deactivate' | 'disconnect'

const cardId = computed(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  return id ?? ''
})
const card = ref<CardDetailResponse | null>(null)
const isCardLoading = ref(true)
const cardError = ref('')
let cardRequestId = 0

const navigationCards = computed(() => {
  if (cardManagementStore.activeCards.length > 0) return cardManagementStore.activeCards
  return card.value ? [{ id: card.value.userCardId }] : []
})
const cardIndex = computed(() => {
  const index = navigationCards.value.findIndex((item) => item.id === card.value?.userCardId)
  return Math.max(index, 0)
})
const cardName = computed(() => card.value?.cardName ?? '카드')
const canMovePrevious = computed(() => cardIndex.value > 0)
const canMoveNext = computed(() => cardIndex.value < navigationCards.value.length - 1)
const memo = computed(() => card.value?.memo ?? '')
const cardMeta = computed(() => {
  if (!card.value) return ''

  const cardNo = card.value.cardNo?.trim()
  return cardNo ? `${card.value.issuerName} · ${cardNo}` : card.value.issuerName
})
const managedCard = computed(() =>
  cardManagementStore.cards.find((item) => item.id === card.value?.userCardId),
)

const isEditingMemo = ref(false)
const isSavingMemo = ref(false)
const memoError = ref('')
const memoDraft = ref('')
const expandedBenefitIds = ref<Set<string>>(new Set())
const actionMenu = ref<HTMLElement | null>(null)
const isActionMenuOpen = ref(false)
const isActionDialogOpen = ref(false)
const pendingAction = ref<CardAction | null>(null)

const actionDialogTitle = computed(() =>
  pendingAction.value === 'deactivate'
    ? `${card.value?.cardName ?? ''} 카드를 비활성화할까요?`
    : `${card.value?.cardName ?? ''} 카드 연결을 해제할까요?`,
)
const actionDialogDescription = computed(() =>
  pendingAction.value === 'deactivate'
    ? '비활성화한 카드는 혜택과 실적 계산에서 제외돼요. 언제든 다시 활성화할 수 있어요.'
    : '연결을 해제하면 저장된 카드 정보가 삭제돼요. 다시 사용하려면 카드를 연결해야 해요.',
)
const actionDialogConfirmLabel = computed(() =>
  pendingAction.value === 'deactivate' ? '비활성화' : '연결 해제',
)

onClickOutside(actionMenu, () => {
  isActionMenuOpen.value = false
})

function resolveBenefitIcon(benefit: CardDetailBenefitResponse) {
  if (/카페|커피|스타벅스|디저트/.test(benefit.title)) return Coffee
  if (/편의점/.test(benefit.title)) return Store
  if (/교통|버스|지하철|택시/.test(benefit.title)) return Bus
  return ShoppingBag
}

function sanitizeDetailHtml(detailHtml: string) {
  return DOMPurify.sanitize(detailHtml, { USE_PROFILES: { html: true } })
}

async function loadCard(userCardId: string) {
  const requestId = ++cardRequestId

  if (!userCardId) {
    card.value = null
    cardError.value = '카드 정보를 찾을 수 없어요.'
    isCardLoading.value = false
    return
  }

  isCardLoading.value = true
  cardError.value = ''

  try {
    const response = await fetchCardDetail(userCardId)
    if (requestId !== cardRequestId) return

    card.value = response
    cardMemoStore.setMemo(response.userCardId, response.memo ?? '')
  } catch {
    if (requestId !== cardRequestId) return
    card.value = null
    cardError.value = '카드 상세정보를 불러오지 못했어요.'
  } finally {
    if (requestId === cardRequestId) isCardLoading.value = false
  }
}

async function loadNavigationCards() {
  try {
    cardManagementStore.setCards(await fetchMyCards())
  } catch {
    // 상세정보 조회가 성공하면 카드 목록 탐색만 비활성화한다.
  }
}

watch(cardId, (id) => void loadCard(id), { immediate: true })

watch(
  () => card.value?.userCardId,
  () => {
    const firstBenefitId = card.value?.benefits[0]?.benefitId
    expandedBenefitIds.value = new Set(firstBenefitId ? [firstBenefitId] : [])
    isEditingMemo.value = false
    isSavingMemo.value = false
    memoError.value = ''
    isActionMenuOpen.value = false
    memoDraft.value = memo.value
  },
)

onMounted(() => void loadNavigationCards())

function goBack() {
  void router.replace({ name: 'home' })
}

function moveCard(offset: number) {
  const nextCard = navigationCards.value[cardIndex.value + offset]
  if (!nextCard) return

  void router.replace({ name: 'card-detail', params: { id: nextCard.id } })
}

function startMemoEditing() {
  memoDraft.value = memo.value
  isEditingMemo.value = true
}

function cancelMemoEditing() {
  memoDraft.value = memo.value
  memoError.value = ''
  isEditingMemo.value = false
}

async function saveMemo() {
  if (!card.value || !memoDraft.value.trim()) return

  const nextMemo = memoDraft.value.trim()
  isSavingMemo.value = true
  memoError.value = ''

  try {
    const updatedCard = await updateCardMemo(card.value.userCardId, nextMemo)
    card.value = { ...card.value, memo: updatedCard.memo }
    cardMemoStore.setMemo(card.value.userCardId, updatedCard.memo ?? '')
    isEditingMemo.value = false
  } catch {
    memoError.value = '메모를 저장하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSavingMemo.value = false
  }
}

function toggleBenefit(benefitId: string) {
  const nextExpandedIds = new Set(expandedBenefitIds.value)

  if (nextExpandedIds.has(benefitId)) nextExpandedIds.delete(benefitId)
  else nextExpandedIds.add(benefitId)

  expandedBenefitIds.value = nextExpandedIds
}

function requestCardAction(action: CardAction) {
  pendingAction.value = action
  isActionMenuOpen.value = false
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
  if (!pendingAction.value || !managedCard.value) return

  if (pendingAction.value === 'deactivate') {
    cardManagementStore.setCardActive(managedCard.value.id, false)
  } else {
    cardManagementStore.disconnectCard(managedCard.value.id)
  }

  cardManagementStore.preserveCardsOnNextLoad()
  closeActionDialog()
  void router.replace({ name: 'card-manage', query: { from: 'home' } })
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <AppBar title="카드 상세" @back="goBack">
      <template #right>
        <div v-if="card" ref="actionMenu" class="relative">
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full text-charcoal transition-colors"
            :class="isActionMenuOpen ? 'bg-screen' : ''"
            aria-label="카드 메뉴"
            aria-controls="card-action-menu"
            :aria-expanded="isActionMenuOpen"
            @click="isActionMenuOpen = !isActionMenuOpen"
          >
            <EllipsisVertical class="size-5" aria-hidden="true" />
          </button>

          <div
            v-if="isActionMenuOpen"
            id="card-action-menu"
            class="absolute right-0 top-11 z-30 w-36 overflow-hidden rounded-sm border border-divider bg-background py-1 shadow-modal"
            role="menu"
          >
            <button
              type="button"
              class="flex h-10 w-full items-center gap-2 px-4 text-left text-body text-charcoal"
              role="menuitem"
              :aria-label="`${cardName} 비활성화`"
              @click="requestCardAction('deactivate')"
            >
              <EyeOff class="size-4 text-gray" aria-hidden="true" />
              비활성화
            </button>
            <button
              type="button"
              class="flex h-10 w-full items-center gap-2 px-4 text-left text-body text-error"
              role="menuitem"
              :aria-label="`${cardName} 연결 해제`"
              @click="requestCardAction('disconnect')"
            >
              <Trash2 class="size-4" aria-hidden="true" />
              연결 해제
            </button>
          </div>
        </div>
      </template>
    </AppBar>

    <main
      v-if="isCardLoading"
      data-card-detail-loading
      class="min-h-0 flex-1 overflow-y-auto px-5 py-6"
      aria-label="카드 상세정보 로딩 중"
    >
      <Skeleton class="mx-auto h-80 w-44 rounded-lg" />
      <Skeleton class="mt-6 h-20 w-full" />
      <Skeleton class="mt-4 h-28 w-full" />
      <Skeleton class="mt-4 h-44 w-full" />
    </main>

    <main v-else-if="card" class="min-h-0 flex-1 overflow-y-auto">
      <section class="border-b border-divider" aria-label="카드 이미지">
        <div class="mt-4 flex h-2 items-center justify-center gap-2">
          <span
            v-for="(item, index) in navigationCards"
            :key="item.id"
            class="h-1.5 rounded-full transition-[width,background-color] duration-200"
            :class="index === cardIndex ? 'w-5 bg-primary' : 'w-1.5 bg-disabled'"
            aria-hidden="true"
          />
        </div>

        <div class="relative flex min-h-80 items-center justify-center px-14 pb-5 pt-4">
          <button
            type="button"
            class="absolute left-4 flex size-12 items-center justify-center rounded-full bg-secondary text-charcoal disabled:bg-screen disabled:text-disabled"
            aria-label="이전 카드"
            :disabled="!canMovePrevious"
            @click="moveCard(-1)"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </button>

          <CardImage
            :src="card.cardImageUrl"
            :alt="`${card.cardName} 카드 이미지`"
            :width="145"
            :height="234"
            class="rounded-md shadow-card"
          />

          <button
            type="button"
            class="absolute right-4 flex size-12 items-center justify-center rounded-full bg-secondary text-charcoal disabled:bg-screen disabled:text-disabled"
            aria-label="다음 카드"
            :disabled="!canMoveNext"
            @click="moveCard(1)"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="border-b border-divider px-5 py-4" aria-labelledby="card-name">
        <h1 id="card-name" class="text-subheading text-charcoal">{{ card.cardName }}</h1>
        <p class="mt-0.5 text-body text-gray">{{ cardMeta }}</p>
      </section>

      <section class="border-b border-divider px-5 py-4" aria-labelledby="card-memo-title">
        <div class="flex items-center justify-between gap-3">
          <h2 id="card-memo-title" class="text-subheading text-charcoal">메모</h2>

          <div v-if="isEditingMemo" class="flex items-center gap-3 text-caption font-semibold">
            <button type="button" class="text-gray" @click="cancelMemoEditing">취소</button>
            <button
              type="button"
              class="text-primary disabled:text-disabled"
              :disabled="!memoDraft.trim() || isSavingMemo"
              @click="saveMemo"
            >
              {{ isSavingMemo ? '저장 중' : '저장' }}
            </button>
          </div>
          <button
            v-else
            type="button"
            class="flex size-9 items-center justify-center rounded-full bg-[#F2EDFF] text-primary"
            aria-label="메모 수정"
            @click="startMemoEditing"
          >
            <Pencil class="size-4" aria-hidden="true" />
          </button>
        </div>

        <textarea
          v-if="isEditingMemo"
          v-model="memoDraft"
          class="mt-2 min-h-20 w-full resize-none rounded-sm border border-divider bg-screen px-3 py-2 text-body text-charcoal focus:border-primary"
          aria-label="카드 메모"
          maxlength="500"
          @keydown.meta.enter="saveMemo"
          @keydown.ctrl.enter="saveMemo"
        />
        <p v-if="memoError" role="alert" class="mt-2 text-caption text-error">{{ memoError }}</p>
        <p v-else-if="!isEditingMemo" class="mt-2 whitespace-pre-line text-body text-charcoal">
          {{ memo || '작성된 메모가 없어요.' }}
        </p>
      </section>

      <section class="border-b border-divider py-4" aria-labelledby="card-benefit-title">
        <h2 id="card-benefit-title" class="px-5 text-subheading text-charcoal">주요 혜택</h2>

        <ul v-if="card.benefits.length > 0" class="mt-3">
          <li v-for="benefit in card.benefits" :key="benefit.benefitId">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-5 py-3 text-left"
              :aria-expanded="expandedBenefitIds.has(benefit.benefitId)"
              :aria-controls="`benefit-description-${benefit.benefitId}`"
              @click="toggleBenefit(benefit.benefitId)"
            >
              <span
                class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <component :is="resolveBenefitIcon(benefit)" class="size-5" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-body font-semibold text-charcoal">{{ benefit.title }}</span>
                <span
                  v-if="benefit.summary"
                  data-benefit-summary
                  class="mt-1 block break-keep text-caption text-gray"
                >
                  {{ benefit.summary }}
                </span>
              </span>
              <ChevronDown
                class="size-4 shrink-0 text-gray transition-transform duration-200"
                :class="expandedBenefitIds.has(benefit.benefitId) ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>

            <div
              v-if="
                (benefit.detailHtml || benefit.detailText) &&
                expandedBenefitIds.has(benefit.benefitId)
              "
              :id="`benefit-description-${benefit.benefitId}`"
              class="mx-5 mb-3 rounded-md bg-screen px-4 py-4 text-body leading-6 text-gray [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc"
            >
              <div
                v-if="benefit.detailHtml"
                data-benefit-detail-html
                class="card-detail-html"
                v-html="sanitizeDetailHtml(benefit.detailHtml)"
              />
              <p v-else class="whitespace-pre-line">{{ benefit.detailText }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="px-5 py-6 text-body text-gray">등록된 주요 혜택이 없어요.</p>
      </section>

      <section class="pb-8 pt-5" aria-labelledby="card-notice-title">
        <h2 id="card-notice-title" class="px-5 text-subheading text-charcoal">유의 사항</h2>
        <ul v-if="card.notices.length > 0" data-card-notices class="mt-4 bg-screen px-5 py-5">
          <li v-for="notice in card.notices" :key="notice.benefitId" class="not-last:mb-5">
            <h3 class="text-body font-semibold text-charcoal">{{ notice.title }}</h3>
            <p v-if="notice.summary" class="mt-1 text-caption text-gray">{{ notice.summary }}</p>
            <div
              v-if="notice.detailHtml"
              data-notice-detail-html
              class="card-detail-html mt-2 text-caption leading-5 text-gray [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc"
              v-html="sanitizeDetailHtml(notice.detailHtml)"
            />
            <p
              v-else-if="notice.detailText"
              class="mt-2 whitespace-pre-line text-caption leading-5 text-gray"
            >
              {{ notice.detailText }}
            </p>
          </li>
        </ul>
        <p v-else class="px-5 py-6 text-body text-gray">등록된 유의 사항이 없어요.</p>
      </section>
    </main>

    <main v-else class="flex min-h-0 flex-1 items-center justify-center">
      <EmptyState
        :title="cardError || '카드 정보를 찾을 수 없어요.'"
        description="잠시 후 다시 시도해 주세요."
        action-label="다시 시도"
        @action="loadCard(cardId)"
      />
    </main>

    <BottomBar active-path="/home" />

    <ConfirmDialog
      v-if="pendingAction"
      :open="isActionDialogOpen"
      :title="actionDialogTitle"
      :description="actionDialogDescription"
      :confirm-label="actionDialogConfirmLabel"
      :destructive="pendingAction === 'disconnect'"
      @update:open="updateActionDialogOpen"
      @cancel="closeActionDialog"
      @confirm="confirmCardAction"
    />
  </div>
</template>

<style scoped>
.card-detail-html {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.card-detail-html :deep(*) {
  max-width: 100%;
}

.card-detail-html :deep(table) {
  width: 100% !important;
  max-width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 18px;
}

.card-detail-html :deep(th),
.card-detail-html :deep(td) {
  padding: 8px 6px;
  border: 1px solid var(--color-divider);
  overflow-wrap: anywhere;
  word-break: keep-all;
  vertical-align: middle;
}

.card-detail-html :deep(.b-table-top) {
  background: var(--color-screen);
  color: var(--color-charcoal);
  font-weight: 600;
}
</style>
