import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteAccountView from '@/domains/mypage/views/DeleteAccountView.vue'
import { deleteMocaAccount } from '@/domains/mypage/api/mypage'

const replace = vi.fn<(location: { name: string }) => Promise<void>>()
const resolve = vi.fn<() => { href: string }>(() => ({ href: '/login' }))
const clearSession = vi.fn<() => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace, resolve }),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => ({ clearSession }),
}))

vi.mock('@/domains/mypage/api/mypage', () => ({
  deleteMocaAccount: vi.fn<(reason?: string) => Promise<void>>(),
}))

describe('DeleteAccountView', () => {
  beforeEach(() => {
    vi.mocked(deleteMocaAccount).mockReset()
    replace.mockReset()
    clearSession.mockReset()
  })

  it('동의 전에는 탈퇴 버튼을 비활성화한다', () => {
    const wrapper = mount(DeleteAccountView)

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('동의 후 선택한 사유와 함께 탈퇴하고 로그인 화면으로 이동한다', async () => {
    vi.mocked(deleteMocaAccount).mockResolvedValue()
    const wrapper = mount(DeleteAccountView)
    const reason = wrapper
      .findAll('button')
      .find((button) => button.text().includes('개인정보가 걱정돼요'))

    expect(reason).toBeDefined()
    if (!reason) throw new Error('탈퇴 사유 버튼을 찾을 수 없습니다.')

    await reason.trigger('click')
    await wrapper.get('[data-slot="checkbox"]').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(deleteMocaAccount).toHaveBeenCalledWith('개인정보가 걱정돼요')
    expect(clearSession).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith({ name: 'login' })
  })

  it('선택한 탈퇴 사유를 다시 누르면 선택을 해제한다', async () => {
    const wrapper = mount(DeleteAccountView)
    const reason = wrapper
      .findAll('button')
      .find((button) => button.text().includes('서비스 사용이 불편해요'))

    expect(reason).toBeDefined()
    if (!reason) throw new Error('탈퇴 사유 버튼을 찾을 수 없습니다.')

    await reason.trigger('click')
    expect(reason.attributes('aria-pressed')).toBe('true')

    await reason.trigger('click')
    expect(reason.attributes('aria-pressed')).toBe('false')
  })

  it('탈퇴 성공 후 로그인 이동만 실패하면 탈퇴 완료 상태와 복구 링크를 표시한다', async () => {
    vi.mocked(deleteMocaAccount).mockResolvedValue()
    replace.mockRejectedValue(new Error('navigation failed'))
    const wrapper = mount(DeleteAccountView)

    await wrapper.get('[data-slot="checkbox"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toContain('회원 탈퇴가 완료되었어요.')
    expect(wrapper.get('a[href="/login"]').text()).toBe('로그인 화면으로 이동')
  })
})
