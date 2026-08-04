import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useDirectCardConnectionStore } from '@/domains/card/stores/directCardConnection'
import { useOwnedCardsStore } from '@/domains/card/stores/ownedCards'
import CardIssuerCardSelectView from '@/domains/card/views/CardIssuerCardSelectView.vue'

const globalStubs = {
  CardPageLayout: {
    template: '<main><slot /><footer><slot name="footer" /></footer></main>',
  },
  MocaButton: {
    props: ['disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  Checkbox: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<button type="button" @click="$emit(\'update:modelValue\', modelValue === true ? false : true)" />',
  },
}

describe('CardIssuerCardSelectView', () => {
  it('모든 카드를 기본 선택하고 선택한 카드만 보유카드에 추가한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    const ownedCardsStore = useOwnedCardsStore()
    directStore.beginLookup('kb-kookmin', true)
    directStore.completeLookup([
      {
        id: 'selected-card-1',
        issuer: 'kb-kookmin',
        name: 'KB 카드 1',
        last4: '1111',
      },
      {
        id: 'selected-card-2',
        issuer: 'kb-kookmin',
        name: 'KB 카드 2',
        last4: '2222',
      },
    ])
    const initialOwnedCardCount = ownedCardsStore.ownedCards.length

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('2개 카드를 찾았어요')
    expect(wrapper.get('footer button').text()).toContain('선택한 카드 2개')

    await wrapper.get('button[aria-label="전체 카드 선택"]').trigger('click')
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('button[aria-label="KB 카드 1 선택"]').trigger('click')
    expect(wrapper.get('footer button').text()).toContain('선택한 카드 1개')

    await wrapper.get('footer button').trigger('click')
    await nextTick()
    await flushPromises()

    expect(ownedCardsStore.ownedCards).toHaveLength(initialOwnedCardCount + 1)
    expect(ownedCardsStore.ownedCards[ownedCardsStore.ownedCards.length - 1]?.id).toBe(
      'selected-card-1',
    )
    expect(router.currentRoute.value.name).toBe('card-issuer-connect-complete')
  })

  it('선택형 카드의 옵션을 모두 고른 뒤에만 불러오기 버튼을 활성화한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const directStore = useDirectCardConnectionStore()
    directStore.beginLookup('kb-kookmin', true)
    directStore.completeLookup([
      {
        id: 'option-card',
        userCardId: 'option-card',
        issuer: 'kb-kookmin',
        name: 'KB 선택형 카드',
        last4: '1111',
        matched: true,
        optionGroups: [
          {
            optionGroupId: 'benefit-group',
            groupKey: 'benefit',
            groupName: '혜택 패키지',
            choices: [
              {
                optionChoiceId: 'shopping-choice',
                choiceKey: 'shopping',
                choiceName: '쇼핑 중심',
              },
              {
                optionChoiceId: 'living-choice',
                choiceKey: 'living',
                choiceName: '생활 중심',
              },
            ],
          },
        ],
      },
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/cards/connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: CardIssuerCardSelectView,
        },
        {
          path: '/cards/connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: { template: '<div />' },
        },
        {
          path: '/cards/connect/select',
          name: 'card-issuer-select',
          component: { template: '<div />' },
        },
      ],
    })
    await router.push({ name: 'card-issuer-card-select', params: { issuerId: 'kb-kookmin' } })
    await router.isReady()

    const wrapper = mount(CardIssuerCardSelectView, {
      global: { plugins: [pinia, router], stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('혜택 패키지')
    expect(wrapper.text()).toContain('선택한 카드의 옵션을 모두 골라 주세요')
    expect(wrapper.get('footer button').attributes('disabled')).toBeDefined()

    await wrapper.get('input[value="shopping-choice"]').setValue()

    expect(directStore.optionSelections).toEqual({
      'option-card': { 'benefit-group': 'shopping-choice' },
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('footer button').attributes('disabled')).toBeUndefined()
  })
})
