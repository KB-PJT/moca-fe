<script setup lang="ts">
import { ChevronDown, Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import PageLayout from '@/shared/components/PageLayout.vue'

type NoticeCategory = '전체' | '카드 연동' | '실적·혜택' | '지도·가맹점' | '계정·로그인' | '기타'

interface NoticeItem {
  id: number
  category: Exclude<NoticeCategory, '전체'>
  title: string
  content: string
}

const categories: NoticeCategory[] = [
  '전체',
  '카드 연동',
  '실적·혜택',
  '지도·가맹점',
  '계정·로그인',
  '기타',
]

const noticeItems: NoticeItem[] = [
  {
    id: 1,
    category: '카드 연동',
    title: '카드 실적은 언제 반영되나요?',
    content:
      '카드사에서 전달된 이용 내역을 기준으로 반영되며, 카드사에 따라 시간이 걸릴 수 있어요.',
  },
  {
    id: 2,
    category: '실적·혜택',
    title: '실제 카드사 혜택과 다른 이유는 무엇인가요?',
    content:
      'MOCA의 혜택 정보는 참고용이며 카드사 정책이나 이용 조건 변경에 따라 차이가 날 수 있어요.',
  },
  {
    id: 3,
    category: '카드 연동',
    title: '카드를 추가하거나 삭제하려면 어떻게 하나요?',
    content: '마이페이지의 내 카드 관리에서 새로운 카드를 연결하거나 기존 카드를 삭제할 수 있어요.',
  },
  {
    id: 4,
    category: '지도·가맹점',
    title: '위치 권한을 꼭 허용해야 하나요?',
    content:
      '주변 혜택 가맹점을 추천받으려면 위치 권한이 필요해요. 권한 없이도 다른 기능은 이용할 수 있어요.',
  },
  {
    id: 5,
    category: '기타',
    title: '앱 데이터를 삭제하면 어떻게 되나요?',
    content:
      '기기의 임시 데이터는 삭제되지만 계정에 연결된 카드와 이용 정보는 다시 로그인하면 확인할 수 있어요.',
  },
]

const searchQuery = ref('')
const selectedCategory = ref<NoticeCategory>('전체')
const expandedNoticeId = ref<number | null>(null)

const filteredNoticeItems = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase('ko-KR')

  return noticeItems.filter((notice) => {
    const matchesCategory =
      selectedCategory.value === '전체' || notice.category === selectedCategory.value
    const matchesKeyword =
      !keyword ||
      notice.title.toLocaleLowerCase('ko-KR').includes(keyword) ||
      notice.content.toLocaleLowerCase('ko-KR').includes(keyword)

    return matchesCategory && matchesKeyword
  })
})

function selectCategory(category: NoticeCategory) {
  selectedCategory.value = category
  expandedNoticeId.value = null
}

function toggleNotice(id: number) {
  expandedNoticeId.value = expandedNoticeId.value === id ? null : id
}
</script>

<template>
  <PageLayout title="공지사항" has-bottom-bar>
    <div class="-mx-5 -my-6 pb-4">
      <div class="px-5 pt-4">
        <label class="relative block">
          <span class="sr-only">공지사항 검색</span>
          <Search
            class="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8C7F74]"
            aria-hidden="true"
          />
          <input
            v-model="searchQuery"
            type="search"
            class="text-body h-11.5 w-full rounded-md border border-black/8 bg-card pr-4 pl-10 text-charcoal outline-none placeholder:text-charcoal/50 focus:border-primary focus:ring-3 focus:ring-primary/15"
            placeholder="궁금한 내용을 검색해보세요"
          />
        </label>
      </div>

      <div
        class="scrollbar-hide mx-5 mt-4 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="공지사항 카테고리"
      >
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          role="tab"
          :aria-selected="selectedCategory === category"
          class="text-caption shrink-0 rounded-full px-3.5 py-1.5 font-bold transition-colors"
          :class="
            selectedCategory === category ? 'bg-primary text-white' : 'bg-divider text-[#8C7F74]'
          "
          @click="selectCategory(category)"
        >
          {{ category }}
        </button>
      </div>

      <section
        class="mx-5 mt-4 overflow-hidden rounded-lg border border-divider/50 bg-card shadow-card"
        aria-label="공지사항 목록"
      >
        <template v-if="filteredNoticeItems.length">
          <article
            v-for="notice in filteredNoticeItems"
            :key="notice.id"
            class="border-b border-black/5 last:border-b-0"
          >
            <button
              type="button"
              class="flex min-h-13 w-full items-center gap-3 px-5 py-3.5 text-left"
              :aria-expanded="expandedNoticeId === notice.id"
              :aria-controls="`notice-content-${notice.id}`"
              @click="toggleNotice(notice.id)"
            >
              <span class="flex w-17 shrink-0 items-center">
                <span
                  class="text-micro rounded-full bg-accent px-2 py-0.5 text-center text-primary"
                >
                  {{ notice.category }}
                </span>
              </span>
              <strong class="text-body min-w-0 flex-1 font-semibold text-charcoal">
                {{ notice.title }}
              </strong>
              <ChevronDown
                class="size-4 shrink-0 text-[#8C7F74] transition-transform"
                :class="expandedNoticeId === notice.id && 'rotate-180'"
                aria-hidden="true"
              />
            </button>
            <div
              v-show="expandedNoticeId === notice.id"
              :id="`notice-content-${notice.id}`"
              class="border-t border-black/5 bg-screen px-5 py-4"
            >
              <p class="text-body leading-6 text-gray">{{ notice.content }}</p>
            </div>
          </article>
        </template>
        <p v-else class="text-body px-5 py-12 text-center text-gray">검색 결과가 없어요.</p>
      </section>
    </div>
  </PageLayout>
</template>
