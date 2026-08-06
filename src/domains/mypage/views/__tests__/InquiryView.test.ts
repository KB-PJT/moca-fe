import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InquiryView from '@/domains/mypage/views/InquiryView.vue'

const push = vi.fn<(location: { name: string }) => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn<() => void>(), push }),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => ({
    user: { email: 'kakao_jimin@kakao.com' },
  }),
}))

describe('InquiryView', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    push.mockClear()
    wrapper = mount(InquiryView)
  })

  it('로그인한 사용자의 이메일을 기본값으로 보여준다', () => {
    expect(wrapper.get<HTMLInputElement>('#inquiry-email').element.value).toBe(
      'kakao_jimin@kakao.com',
    )
  })

  it('필수 항목을 모두 입력해 제출하면 마이페이지로 이동한다', async () => {
    const submitButton = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    expect(submitButton.element.disabled).toBe(true)

    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드를 여러 번 등록해도 연결되지 않습니다.')

    expect(submitButton.element.disabled).toBe(false)
    await wrapper.get('form').trigger('submit')
    expect(push).toHaveBeenCalledWith({
      name: 'mypage',
      state: { inquirySubmitted: true },
    })
  })

  it('이메일이 비어 있으면 제출할 수 없다', async () => {
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')
    await wrapper.get('#inquiry-email').setValue('')

    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
  })
})
