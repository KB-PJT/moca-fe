import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CardCredentialDialog from '@/domains/card/components/CardCredentialDialog.vue'

const dialogStubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<section><slot /></section>' },
  DialogHeader: { template: '<header><slot /></header>' },
  DialogTitle: { template: '<h1><slot /></h1>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogFooter: { template: '<footer><slot /></footer>' },
}

describe('CardCredentialDialog', () => {
  it('카드번호와 비밀번호를 숫자로 정리해 제출한다', async () => {
    const wrapper = mount(CardCredentialDialog, {
      props: {
        open: true,
        cardName: '현대카드 M',
        cardNo: '1234********5678',
      },
      global: { stubs: dialogStubs },
    })

    expect(wrapper.text()).toContain('현대카드 M')
    expect(wrapper.text()).toContain('1234********5678')
    expect(wrapper.get('header p span').classes()).toContain('text-primary')
    expect(wrapper.get('#card-credential-number').classes()).toContain('rounded-sm!')
    expect(wrapper.get('input[type="password"]').classes()).toContain('rounded-sm!')

    await wrapper.get('#card-credential-number').setValue('1234-5678-abcd-9012-3456')
    await wrapper.get('input[type="password"]').setValue('1a2b34')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { cardNo: '1234567890123456', cardPassword: '1234' },
    ])
  })

  it('서버 필드 오류를 표시한다', () => {
    const wrapper = mount(CardCredentialDialog, {
      props: {
        open: true,
        cardName: '현대카드 M',
        errors: {
          cardPassword: '카드 비밀번호는 필수입니다.',
          form: '카드번호가 일치하지 않습니다.',
        },
      },
      global: { stubs: dialogStubs },
    })

    expect(wrapper.text()).toContain('카드 비밀번호는 필수입니다.')
    expect(wrapper.text()).toContain('카드번호가 일치하지 않습니다.')
  })
})
