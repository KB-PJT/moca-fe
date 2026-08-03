<script setup lang="ts">
import { Eye, EyeOff, LoaderCircle, Plus, RotateCw, Trash2 } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import BottomBar from '@/shared/components/BottomBar.vue'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import PageLayout from '@/shared/components/PageLayout.vue'

const REFRESH_DURATION_MS = 700

const route = useRoute()
const router = useRouter()
const cardManagementStore = useCardManagementStore()
const isRefreshing = ref(false)
let refreshTimer: ReturnType<typeof setTimeout> | undefined

const activeBottomBarPath = computed(() => {
  const from = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from

  if (from === 'home') return '/home'
  if (from === 'mypage') return '/mypage'
  return undefined
})

function refreshCards() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  refreshTimer = setTimeout(() => {
    cardManagementStore.reset()
    isRefreshing.value = false
    refreshTimer = undefined
  }, REFRESH_DURATION_MS)
}

function addCard() {
  void router.push({ name: 'card-connect' })
}

onBeforeUnmount(() => {
  if (refreshTimer) clearTimeout(refreshTimer)
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <div class="min-h-0 flex-1">
      <PageLayout title="내 카드 관리" has-bottom-bar>
        <section aria-labelledby="active-card-heading">
          <div class="mb-3 flex items-center justify-between">
            <h1 id="active-card-heading" class="text-caption text-gray">
              등록된 카드 {{ cardManagementStore.activeCards.length }}개
            </h1>
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

          <ul v-if="cardManagementStore.activeCards.length" class="space-y-3">
            <li v-for="card in cardManagementStore.activeCards" :key="card.id">
              <article class="overflow-hidden rounded-md bg-card shadow-card">
                <div class="flex min-h-20 items-center gap-4 px-4 py-4">
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

                <div class="grid h-11 grid-cols-2 border-t border-divider">
                  <button
                    type="button"
                    class="flex items-center justify-center gap-1.5 border-r border-divider text-body font-medium text-gray"
                    :aria-label="`${card.name} 비활성화`"
                    @click="cardManagementStore.setCardActive(card.id, false)"
                  >
                    <EyeOff class="size-4" aria-hidden="true" />
                    비활성화
                  </button>
                  <button
                    type="button"
                    class="flex items-center justify-center gap-1.5 text-body font-medium text-rose-500"
                    :aria-label="`${card.name} 연결 해제`"
                    @click="cardManagementStore.disconnectCard(card.id)"
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
                    @click="cardManagementStore.disconnectCard(card.id)"
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
  </div>
</template>
