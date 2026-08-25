import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InquiryView from '@/domains/mypage/views/InquiryView.vue'
import type { CreateInquiryRequest } from '@/domains/mypage/api/inquiry'

const push = vi.fn<(location: { name: string }) => void>()
const createInquiry = vi.hoisted(() => vi.fn<(request: CreateInquiryRequest) => Promise<unknown>>())

vi.mock('@/domains/mypage/api/inquiry', () => ({ createInquiry }))

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
    createInquiry.mockReset()
    createInquiry.mockResolvedValue({ inquiryId: 'inquiry-id' })
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

    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드를 여러 번 등록해도 연결되지 않습니다.')

    expect(submitButton.element.disabled).toBe(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createInquiry).toHaveBeenCalledWith({
      inquiryType: 'card_link',
      title: '카드가 연동되지 않아요',
      content: '카드를 여러 번 등록해도 연결되지 않습니다.',
      replyEmail: 'kakao_jimin@kakao.com',
    })
    expect(push).toHaveBeenCalledWith({
      name: 'mypage',
      state: { inquirySubmitted: true },
    })
  })

  it('문의 등록 후 이동에 실패하면 중복 등록 없이 마이페이지 이동을 재시도한다', async () => {
    push.mockRejectedValueOnce(new Error('navigation failed'))
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createInquiry).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="alert"]').text()).toContain('문의는 접수되었지만')

    await wrapper.get('[data-testid="mypage-navigation-retry"]').trigger('click')
    await flushPromises()

    expect(createInquiry).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledTimes(2)
  })

  it('문의 등록에 실패하면 화면에 오류를 표시하고 이동하지 않는다', async () => {
    createInquiry.mockRejectedValueOnce(new Error('network error'))
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it.each([
    ['VALIDATION_FAILED', '입력한 내용을 다시 확인해주세요.'],
    ['AUTHENTICATION_REQUIRED', '로그인이 필요합니다. 다시 로그인해주세요.'],
  ])('%s 오류에 맞는 안내를 표시한다', async (code, message) => {
    createInquiry.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          data: null,
          error: { code, message: 'server message', fields: {} },
        },
      },
    })
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(message)
    expect(push).not.toHaveBeenCalled()
  })

  it.each([
    { isAxiosError: true, response: {} },
    { isAxiosError: true, response: { data: {} } },
  ])('Axios 오류 응답 형식이 불완전하면 기본 오류를 표시한다', async (apiError) => {
    createInquiry.mockRejectedValueOnce(apiError)
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe(
      '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('이메일이 비어 있으면 제출할 수 없다', async () => {
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')
    await wrapper.get('#inquiry-email').setValue('')

    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
  })

  it.each([
    ['잘못된 이메일', 'invalid-email', '문의 제목', '문의 내용'],
    ['100자를 초과한 제목', 'test@example.com', '가'.repeat(101), '문의 내용'],
    ['2000자를 초과한 내용', 'test@example.com', '문의 제목', '가'.repeat(2001)],
  ])('%s이면 제출할 수 없다', async (_, testEmail, testTitle, testContent) => {
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-email').setValue(testEmail)
    await wrapper.get('#inquiry-title').setValue(testTitle)
    await wrapper.get('#inquiry-content').setValue(testContent)

    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    await wrapper.get('form').trigger('submit')

    expect(createInquiry).not.toHaveBeenCalled()
  })

  it('문의 접수 중에는 버튼을 비활성화하고 중복 제출을 막는다', async () => {
    let resolveInquiry: ((value: unknown) => void) | undefined
    createInquiry.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveInquiry = resolve
        }),
    )
    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    await wrapper.get('#inquiry-title').setValue('카드가 연동되지 않아요')
    await wrapper.get('#inquiry-content').setValue('카드 연결이 되지 않습니다.')

    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get('button[type="submit"]').text()).toBe('접수 중...')
    expect(createInquiry).toHaveBeenCalledTimes(1)

    resolveInquiry?.({ inquiryId: 'inquiry-id' })
    await flushPromises()
  })
})
