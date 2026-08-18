import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ProfileEditView from '@/domains/mypage/views/ProfileEditView.vue'

const authStore = vi.hoisted(() => ({
  user: { nickname: '지민', email: 'jimin@example.com' },
  updateNickname: vi.fn<(nickname: string) => void>(),
}))

vi.mock('@/domains/auth/stores/auth', () => ({
  useAuthStore: () => authStore,
}))
vi.mock('@/domains/mypage/api/mypage', () => ({
  updateNickname: vi.fn<(nickname: string) => Promise<string>>(),
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn<(to: unknown) => Promise<void>>() }),
}))

describe('ProfileEditView', () => {
  it('한글 한 글자가 조합 중이어도 변경사항을 반영해 저장 버튼을 활성화한다', async () => {
    const wrapper = mount(ProfileEditView, {
      global: {
        stubs: {
          PageLayout: { template: '<main><slot /><slot name="footer" /></main>' },
        },
      },
    })
    const input = wrapper.get('input[name="nickname"]')
    const inputElement = input.element as HTMLInputElement

    await input.trigger('compositionstart')
    inputElement.value = '지민아'
    await input.trigger('input')

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
