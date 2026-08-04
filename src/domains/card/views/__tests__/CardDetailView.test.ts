import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CardDetailView from '@/domains/card/views/CardDetailView.vue'

const back = vi.fn<() => void>()
const routeParams = { id: 'home-kb-wesh' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ back }),
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
}

describe('CardDetailView', () => {
  beforeEach(() => {
    back.mockClear()
    routeParams.id = 'home-kb-wesh'
  })

  it('선택한 카드의 상세 정보와 주요 혜택을 표시한다', () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    expect(wrapper.text()).toContain('KB My WE:SH')
    expect(wrapper.text()).toContain('KB국민카드 · •••• 4321')
    expect(wrapper.text()).toContain('배달 귀요미 카드')
    expect(wrapper.text()).toContain('주요 혜택')
    expect(wrapper.text()).toContain('스타벅스·이디야·투썸플레이스')
    expect(wrapper.text()).toContain('유의 사항')
  })

  it('다른 카드 ID로 접근하면 해당 카드 정보를 표시한다', () => {
    routeParams.id = 'home-shinhan-mrlife'
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    expect(wrapper.text()).toContain('신한카드 Mr.Life')
    expect(wrapper.text()).toContain('신한카드 · •••• 8847')
  })

  it('상단 뒤로가기를 누르면 이전 화면으로 이동한다', async () => {
    const wrapper = mount(CardDetailView, { global: { stubs: globalStubs } })

    await wrapper.get('[data-back]').trigger('click')

    expect(back).toHaveBeenCalledOnce()
  })
})
