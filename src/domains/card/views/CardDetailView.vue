<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
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
  getMockCardDetail,
  MOCK_CARD_DETAILS,
  type CardBenefitIcon,
} from '@/domains/card/mocks/cardDetails'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import AppBar from '@/shared/components/AppBar.vue'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const cardMemoStore = useCardMemoStore()
const cardManagementStore = useCardManagementStore()

type CardAction = 'deactivate' | 'disconnect'

const benefitIcons = {
  cafe: Coffee,
  convenience: Store,
  transit: Bus,
  subscription: ShoppingBag,
} satisfies Record<CardBenefitIcon, typeof Coffee>

const cardId = computed(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  return id ?? ''
})
const card = computed(() => getMockCardDetail(cardId.value) ?? MOCK_CARD_DETAILS[0] ?? null)
const cardIndex = computed(() => {
  const index = MOCK_CARD_DETAILS.findIndex((item) => item.id === card.value?.id)
  return Math.max(index, 0)
})
const cardName = computed(() => card.value?.name ?? '카드')
const canMovePrevious = computed(() => cardIndex.value > 0)
const canMoveNext = computed(() => cardIndex.value < MOCK_CARD_DETAILS.length - 1)
const memo = computed(() => (card.value ? cardMemoStore.getMemo(card.value.id) : ''))
const managedCard = computed(() =>
  cardManagementStore.cards.find(
    (item) => item.name === card.value?.name && item.last4 === card.value?.last4,
  ),
)

const isEditingMemo = ref(false)
const memoDraft = ref('')
const expandedBenefitIds = ref<Set<string>>(new Set())
const actionMenu = ref<HTMLElement | null>(null)
const isActionMenuOpen = ref(false)
const isActionDialogOpen = ref(false)
const pendingAction = ref<CardAction | null>(null)

const actionDialogTitle = computed(() =>
  pendingAction.value === 'deactivate'
    ? `${card.value?.name ?? ''} 카드를 비활성화할까요?`
    : `${card.value?.name ?? ''} 카드 연결을 해제할까요?`,
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

watch(
  () => card.value?.id,
  () => {
    const firstBenefitId = card.value?.benefits[0]?.id
    expandedBenefitIds.value = new Set(firstBenefitId ? [firstBenefitId] : [])
    isEditingMemo.value = false
    isActionMenuOpen.value = false
    memoDraft.value = memo.value
  },
  { immediate: true },
)

function goBack() {
  void router.replace({ name: 'home' })
}

function moveCard(offset: number) {
  const nextCard = MOCK_CARD_DETAILS[cardIndex.value + offset]
  if (!nextCard) return

  void router.replace({ name: 'card-detail', params: { id: nextCard.id } })
}

function startMemoEditing() {
  memoDraft.value = memo.value
  isEditingMemo.value = true
}

function cancelMemoEditing() {
  memoDraft.value = memo.value
  isEditingMemo.value = false
}

function saveMemo() {
  if (!card.value || !memoDraft.value.trim()) return

  cardMemoStore.setMemo(card.value.id, memoDraft.value)
  isEditingMemo.value = false
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
        <div ref="actionMenu" class="relative">
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

    <main v-if="card" class="min-h-0 flex-1 overflow-y-auto">
      <section class="border-b border-divider" aria-label="카드 이미지">
        <div class="mt-4 flex h-2 items-center justify-center gap-2">
          <span
            v-for="(item, index) in MOCK_CARD_DETAILS"
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
            :src="card.imageUrl"
            :alt="`${card.name} 카드 이미지`"
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
        <h1 id="card-name" class="text-subheading text-charcoal">{{ card.name }}</h1>
        <p class="mt-0.5 text-body text-gray">{{ card.issuerName }} · •••• {{ card.last4 }}</p>
        <p class="mt-2 text-body text-charcoal">{{ card.description }}</p>
        <p class="mt-2 text-caption text-gray">최종 갱신 {{ card.updatedAt }}</p>
      </section>

      <section class="border-b border-divider px-5 py-4" aria-labelledby="card-memo-title">
        <div class="flex items-center justify-between gap-3">
          <h2 id="card-memo-title" class="text-subheading text-charcoal">메모</h2>

          <div v-if="isEditingMemo" class="flex items-center gap-3 text-caption font-semibold">
            <button type="button" class="text-gray" @click="cancelMemoEditing">취소</button>
            <button
              type="button"
              class="text-primary disabled:text-disabled"
              :disabled="!memoDraft.trim()"
              @click="saveMemo"
            >
              저장
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
          maxlength="80"
          @keydown.meta.enter="saveMemo"
          @keydown.ctrl.enter="saveMemo"
        />
        <p v-else class="mt-2 whitespace-pre-line text-body text-charcoal">{{ memo }}</p>
      </section>

      <section class="border-b border-divider py-4" aria-labelledby="card-benefit-title">
        <h2 id="card-benefit-title" class="px-5 text-subheading text-charcoal">주요 혜택</h2>

        <ul class="mt-3">
          <li v-for="benefit in card.benefits" :key="benefit.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-5 py-3 text-left"
              :aria-expanded="expandedBenefitIds.has(benefit.id)"
              :aria-controls="`benefit-description-${benefit.id}`"
              @click="toggleBenefit(benefit.id)"
            >
              <span
                class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <component :is="benefitIcons[benefit.icon]" class="size-5" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-caption text-gray">{{ benefit.category }}</span>
                <span class="block text-body font-semibold text-charcoal">{{ benefit.title }}</span>
              </span>
              <span class="shrink-0 text-caption text-gray">{{ benefit.condition }}</span>
              <ChevronDown
                class="size-4 shrink-0 text-gray transition-transform duration-200"
                :class="expandedBenefitIds.has(benefit.id) ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>

            <div
              v-if="benefit.description && expandedBenefitIds.has(benefit.id)"
              :id="`benefit-description-${benefit.id}`"
              class="mx-5 mb-3 rounded-md bg-screen px-4 py-4 text-body leading-6 text-gray"
            >
              {{ benefit.description }}
            </div>
          </li>
        </ul>
      </section>

      <section class="pb-8 pt-5" aria-labelledby="card-notice-title">
        <h2 id="card-notice-title" class="px-5 text-subheading text-charcoal">유의 사항</h2>
        <!-- TODO(API): 수집 단계에서 안전하게 정제된 카드사 HTML만 전달받아 사용한다. -->
        <div
          data-card-notice-html
          class="mt-4 bg-screen px-5 py-5 text-caption leading-5 text-gray [&_h3]:mb-2 [&_h3]:text-body [&_li]:before:content-['-_']"
          v-html="card.noticeHtml"
        />
      </section>
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
