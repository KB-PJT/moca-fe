import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardDetailBenefitResponse, CardDetailResponse } from '@/domains/card/api/cardDetail'
import type { MyCardItemResponse, MyCardsResponse } from '@/domains/card/api/cardManagement'
import CardDetailView from '@/domains/card/views/CardDetailView.vue'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

const apiMocks = vi.hoisted(() => ({
  fetchCardDetail: vi.fn<(userCardId: string) => Promise<CardDetailResponse>>(),
  fetchMyCards: vi.fn<() => Promise<MyCardsResponse>>(),
  updateCardMemo: vi.fn<(userCardId: string, memo: string | null) => Promise<MyCardItemResponse>>(),
}))

vi.mock('@/domains/card/api/cardDetail', () => ({
  fetchCardDetail: apiMocks.fetchCardDetail,
  updateCardMemo: apiMocks.updateCardMemo,
}))

vi.mock('@/domains/card/api/cardManagement', () => ({
  fetchMyCards: apiMocks.fetchMyCards,
}))

const replace = vi.fn<(location: unknown) => void>()
const routeParams = { id: 'managed-kb-wesh' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ replace }),
}))

const globalStubs = {
  AppBar: {
    props: ['title'],
    emits: ['back'],
    template:
      '<header><button data-back @click="$emit(\'back\')" />{{ title }}<slot name="right" /></header>',
  },
  BottomBar: { template: '<nav />' },
  CardImage: {
    props: ['src', 'alt', 'width', 'height'],
    template: '<img :src="src ?? undefined" :alt="alt" />',
  },
  ConfirmDialog: {
    props: ['open', 'title', 'description', 'confirmLabel', 'destructive'],
    emits: ['update:open', 'cancel', 'confirm'],
    template: `
      <div v-if="open" data-confirm-dialog :data-destructive="destructive">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <button @click="$emit('cancel')">취소</button>
        <button :aria-label="confirmLabel + ' 확인'" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    `,
  },
}

const benefits: CardDetailBenefitResponse[] = [
  {
    benefitId: 'benefit-cafe',
    title: '스타벅스, 폴바셋 10% 할인',
    summary: '월 최대 5,000원',
    detailText: '스타벅스·이디야·투썸플레이스 등 카페 가맹점 결제 시 10% 할인',
    detailHtml:
      '<p><strong>스타벅스·이디야·투썸플레이스</strong> 등 카페 가맹점 결제 시 10% 할인</p><img src="x" onerror="alert(1)"><script>alert(1)</script>',
  },
  {
    benefitId: 'benefit-convenience',
    title: '편의점 5% 할인',
    summary: '건당 1만원 이상 결제 시',
    detailText: 'GS25·CU 등 편의점 가맹점에서 건당 1만원 이상 결제 시 5% 할인',
    detailHtml: null,
  },
]

const notices: CardDetailBenefitResponse[] = [
  {
    benefitId: 'notice-discount',
    title: '할인서비스 적용 안내',
    summary: null,
    detailText: '할인서비스는 환급할인으로 제공됩니다.',
    detailHtml:
      '<p>할인서비스는 <strong>환급할인</strong>으로 제공됩니다.</p><a href="javascript:alert(1)">안내</a>',
  },
]

function createCardDetail(
  userCardId: string,
  cardName: string,
  issuerName: string,
  cardNo: string,
): CardDetailResponse {
  return {
    userCardId,
    cardName,
    cardNo,
    issuerId: `${userCardId}-issuer`,
    issuerName,
    cardImageUrl: null,
    memo: userCardId === 'managed-kb-wesh' ? '스타벅스, 폴바셋 10% 할인' : null,
    benefits,
    notices,
  }
}

const cardDetails: Record<string, CardDetailResponse> = {
  'managed-kb-wesh': createCardDetail(
    'managed-kb-wesh',
    'KB My WE:SH',
    'KB국민카드',
    '123456******4321',
  ),
  'managed-kb-taptap': createCardDetail(
    'managed-kb-taptap',
    'KB국민 청춘대로 톡톡카드',
    'KB국민카드',
    '123456******1024',
  ),
  'managed-shinhan-mrlife': createCardDetail(
    'managed-shinhan-mrlife',
    '신한카드 Mr.Life',
    '신한카드',
    '123456******8847',
  ),
}

const myCardsResponse: MyCardsResponse = {
  lastSyncedAt: null,
  activeCards: Object.values(cardDetails).map((card) => ({
    userCardId: card.userCardId,
    cardName: card.cardName,
    cardNo: card.cardNo,
    issuerId: card.issuerId,
    issuerName: card.issuerName,
    cardImageUrl: card.cardImageUrl,
    memo: card.memo,
  })),
  inactiveCards: [],
}

async function mountCardDetail() {
  const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })
  await flushPromises()
  return wrapper
}

describe('CardDetailView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    apiMocks.fetchCardDetail.mockReset()
    apiMocks.fetchCardDetail.mockImplementation(async (userCardId) => {
      const detail = cardDetails[userCardId]
      if (!detail) throw new Error('not found')
      return detail
    })
    apiMocks.fetchMyCards.mockReset()
    apiMocks.fetchMyCards.mockResolvedValue(myCardsResponse)
    apiMocks.updateCardMemo.mockReset()
    apiMocks.updateCardMemo.mockImplementation(async (userCardId, memo) => {
      const detail = cardDetails[userCardId]
      if (!detail) throw new Error('not found')
      return { ...detail, memo }
    })
    replace.mockClear()
    routeParams.id = 'managed-kb-wesh'
  })

  it('선택한 카드의 상세 정보와 주요 혜택을 API에서 조회해 표시한다', async () => {
    const wrapper = await mountCardDetail()

    expect(apiMocks.fetchCardDetail).toHaveBeenCalledWith('managed-kb-wesh')
    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('KB국민카드 · 123456******4321')
    expect(wrapper.text()).toContain('스타벅스, 폴바셋 10% 할인')
    expect(wrapper.text()).toContain('스타벅스·이디야·투썸플레이스')
    expect(wrapper.get('[data-benefit-summary]').classes()).not.toContain('shrink-0')
    expect(wrapper.get('[data-card-notices] h3').text()).toBe('할인서비스 적용 안내')
    expect(wrapper.text()).toContain('할인서비스는 환급할인으로 제공됩니다.')
    expect(wrapper.get('[data-benefit-detail-html] strong').text()).toContain('스타벅스')
    expect(wrapper.get('[data-benefit-detail-html]').html()).not.toContain('onerror')
    expect(wrapper.find('[data-benefit-detail-html] script').exists()).toBe(false)
    expect(wrapper.get('[data-notice-detail-html] strong').text()).toBe('환급할인')
    expect(wrapper.get('[data-notice-detail-html] a').attributes('href')).toBeUndefined()
  })

  it('다른 카드 ID로 접근하면 해당 카드 정보를 조회한다', async () => {
    routeParams.id = 'managed-shinhan-mrlife'
    const wrapper = await mountCardDetail()

    expect(apiMocks.fetchCardDetail).toHaveBeenCalledWith('managed-shinhan-mrlife')
    expect(wrapper.text()).toContain('신한카드 Mr.Life')
    expect(wrapper.text()).toContain('신한카드 · 123456******8847')
  })

  it('상단 뒤로가기를 누르면 홈 화면으로 이동한다', async () => {
    const wrapper = await mountCardDetail()

    await wrapper.get('[data-back]').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'home' })
  })

  it('화살표로 다음 보유 카드의 상세 주소를 교체한다', async () => {
    const wrapper = await mountCardDetail()

    await wrapper.get('button[aria-label="다음 카드"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({
      name: 'card-detail',
      params: { id: 'managed-kb-taptap' },
    })
    expect(wrapper.get('button[aria-label="이전 카드"]').attributes('disabled')).toBeDefined()
  })

  it('혜택 행을 펼치고 접는다', async () => {
    const wrapper = await mountCardDetail()
    const convenienceButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('편의점'))

    expect(wrapper.text()).not.toContain('GS25·CU 등 편의점')
    await convenienceButton?.trigger('click')
    expect(wrapper.text()).toContain('GS25·CU 등 편의점')
    await convenienceButton?.trigger('click')
    expect(wrapper.text()).not.toContain('GS25·CU 등 편의점')
  })

  it('카드 메뉴에서 비활성화하면 관리 상태에 반영하고 관리 화면으로 이동한다', async () => {
    const wrapper = await mountCardDetail()
    const cardManagementStore = useCardManagementStore()
    const preserveCardsOnNextLoad = vi.spyOn(cardManagementStore, 'preserveCardsOnNextLoad')

    await wrapper.get('button[aria-label="카드 메뉴"]').trigger('click')
    await wrapper.get('button[aria-label="KB My WE:SH 비활성화"]').trigger('click')
    await wrapper.get('button[aria-label="비활성화 확인"]').trigger('click')

    expect(cardManagementStore.cards.find((item) => item.id === 'managed-kb-wesh')?.isActive).toBe(
      false,
    )
    expect(preserveCardsOnNextLoad).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith({
      name: 'card-manage',
      query: { from: 'home' },
    })
  })

  it('카드 메뉴에서 연결 해제하면 관리 목록에서 제거한다', async () => {
    const wrapper = await mountCardDetail()
    const cardManagementStore = useCardManagementStore()

    await wrapper.get('button[aria-label="카드 메뉴"]').trigger('click')
    await wrapper.get('button[aria-label="KB My WE:SH 연결 해제"]').trigger('click')

    expect(wrapper.get('[data-confirm-dialog]').attributes('data-destructive')).toBe('true')
    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')

    expect(cardManagementStore.cards.some((item) => item.id === 'managed-kb-wesh')).toBe(false)
  })

  it('메모를 수정하면 API와 카드별 메모 상태를 갱신한다', async () => {
    const wrapper = await mountCardDetail()

    await wrapper.get('button[aria-label="메모 수정"]').trigger('click')
    await wrapper.get('textarea[aria-label="카드 메모"]').setValue('주말 카페 결제용 카드')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '저장')
      ?.trigger('click')
    await flushPromises()

    expect(apiMocks.updateCardMemo).toHaveBeenCalledWith('managed-kb-wesh', '주말 카페 결제용 카드')
    expect(wrapper.text()).toContain('주말 카페 결제용 카드')
    expect(useCardMemoStore().getMemo('managed-kb-wesh')).toBe('주말 카페 결제용 카드')
  })

  it('메모 저장 중 단축키를 반복해도 API를 한 번만 호출한다', async () => {
    let resolveUpdate!: (card: MyCardItemResponse) => void
    apiMocks.updateCardMemo.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      }),
    )
    const wrapper = await mountCardDetail()

    await wrapper.get('button[aria-label="메모 수정"]').trigger('click')
    const textarea = wrapper.get('textarea[aria-label="카드 메모"]')
    await textarea.setValue('주말 카페 결제용 카드')
    await textarea.trigger('keydown', { key: 'Enter', metaKey: true })
    await textarea.trigger('keydown', { key: 'Enter', ctrlKey: true })

    expect(apiMocks.updateCardMemo).toHaveBeenCalledOnce()

    resolveUpdate({ ...myCardsResponse.activeCards[0]!, memo: '주말 카페 결제용 카드' })
    await flushPromises()
  })

  it('상세 조회에 실패하면 재시도 가능한 오류 상태를 표시한다', async () => {
    apiMocks.fetchCardDetail.mockRejectedValueOnce(new Error('network error'))

    const wrapper = await mountCardDetail()

    expect(wrapper.text()).toContain('카드 상세정보를 불러오지 못했어요.')
    expect(wrapper.text()).toContain('다시 시도')
  })
})
