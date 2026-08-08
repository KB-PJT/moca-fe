import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardDetailView from '@/domains/card/views/CardDetailView.vue'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

const replace = vi.fn<(location: unknown) => void>()
const routeParams = { id: 'home-kb-wesh' }

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

describe('CardDetailView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    useCardManagementStore().setCards({
      lastSyncedAt: null,
      activeCards: [
        {
          userCardId: 'managed-kb-wesh',
          cardName: 'KB My WE:SH',
          cardNo: '123456******4321',
          issuerId: 'kb-issuer-id',
          issuerName: 'KB국민카드',
          cardImageUrl: null,
          memo: null,
        },
      ],
      inactiveCards: [],
    })
    replace.mockClear()
    routeParams.id = 'home-kb-wesh'
  })

  it('선택한 카드의 상세 정보와 주요 혜택을 표시한다', () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('KB국민카드 · •••• 4321')
    expect(wrapper.text()).toContain('스타벅스, 폴바셋 10% 할인')
    expect(wrapper.text()).toContain('주요 혜택')
    expect(wrapper.text()).toContain('스타벅스·이디야·투썸플레이스')
    expect(wrapper.text()).toContain('유의 사항')
    expect(wrapper.get('[data-card-notice-html] h3').text()).toBe('할인서비스 적용 안내')
    expect(wrapper.findAll('[data-card-notice-html] li')).toHaveLength(3)
  })

  it('다른 카드 ID로 접근하면 해당 카드 정보를 표시한다', () => {
    routeParams.id = 'home-shinhan-mrlife'
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    expect(wrapper.text()).toContain('신한카드 Mr.Life')
    expect(wrapper.text()).toContain('신한카드 · •••• 8847')
  })

  it('상단 뒤로가기를 누르면 홈 화면으로 이동한다', async () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    await wrapper.get('[data-back]').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'home' })
  })

  it('화살표로 다음 카드 상세 주소를 히스토리 추가 없이 교체한다', async () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    await wrapper.get('button[aria-label="다음 카드"]').trigger('click')

    expect(replace).toHaveBeenCalledWith({
      name: 'card-detail',
      params: { id: 'home-kb-taptap' },
    })
    expect(wrapper.get('button[aria-label="이전 카드"]').attributes('disabled')).toBeDefined()
  })

  it('혜택 행을 펼치고 접는다', async () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })
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
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })
    const cardManagementStore = useCardManagementStore()
    const preserveCardsOnNextLoad = vi.spyOn(cardManagementStore, 'preserveCardsOnNextLoad')

    await wrapper.get('button[aria-label="카드 메뉴"]').trigger('click')
    expect(wrapper.text()).toContain('비활성화')
    expect(wrapper.text()).toContain('연결 해제')

    await wrapper.get('button[aria-label="KB My WE:SH 비활성화"]').trigger('click')
    expect(wrapper.text()).toContain('KB My WE:SH 카드를 비활성화할까요?')

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
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })
    const cardManagementStore = useCardManagementStore()

    await wrapper.get('button[aria-label="카드 메뉴"]').trigger('click')
    await wrapper.get('button[aria-label="KB My WE:SH 연결 해제"]').trigger('click')

    expect(wrapper.get('[data-confirm-dialog]').attributes('data-destructive')).toBe('true')
    await wrapper.get('button[aria-label="연결 해제 확인"]').trigger('click')

    expect(cardManagementStore.cards.some((item) => item.id === 'managed-kb-wesh')).toBe(false)
  })

  it('메모를 수정하면 카드별 메모 상태에 저장한다', async () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    await wrapper.get('button[aria-label="메모 수정"]').trigger('click')
    await wrapper.get('textarea[aria-label="카드 메모"]').setValue('주말 카페 결제용 카드')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '저장')
      ?.trigger('click')

    expect(wrapper.text()).toContain('주말 카페 결제용 카드')
    expect(useCardMemoStore().getMemo('home-kb-wesh')).toBe('주말 카페 결제용 카드')
  })
})
