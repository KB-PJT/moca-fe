import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PwaUpdatePrompt from '@/shared/components/PwaUpdatePrompt.vue'

type RegisterOptions = {
  onNeedRefresh?: () => void
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
}

const pwaMocks = vi.hoisted(() => ({
  options: null as RegisterOptions | null,
  updateServiceWorker: vi.fn<(reloadPage?: boolean) => Promise<void>>(),
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: RegisterOptions) => {
    pwaMocks.options = options
    return pwaMocks.updateServiceWorker
  },
}))

const globalStubs = {
  ConfirmDialog: {
    props: ['open', 'title', 'description', 'confirmLabel', 'cancelLabel'],
    emits: ['update:open', 'cancel', 'confirm'],
    template: `
      <div v-if="open" data-update-prompt>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <button @click="$emit('cancel')">{{ cancelLabel }}</button>
        <button @click="$emit('confirm')">{{ confirmLabel }}</button>
      </div>
    `,
  },
}

describe('PwaUpdatePrompt', () => {
  beforeEach(() => {
    sessionStorage.clear()
    pwaMocks.updateServiceWorker.mockReset()
    pwaMocks.updateServiceWorker.mockResolvedValue(undefined)
  })

  it('새 서비스 워커가 대기하면 업데이트 안내를 표시한다', async () => {
    const wrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })

    pwaMocks.options?.onNeedRefresh?.()
    await nextTick()

    expect(wrapper.text()).toContain('새 버전이 준비됐어요')
    expect(wrapper.text()).toContain('최신 기능을 사용하려면 앱을 업데이트해 주세요.')
  })

  it('업데이트를 확인하면 새 서비스 워커를 적용한다', async () => {
    const wrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })
    pwaMocks.options?.onNeedRefresh?.()
    await nextTick()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '업데이트')
      ?.trigger('click')

    expect(pwaMocks.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('나중에를 선택하면 업데이트 안내를 닫는다', async () => {
    const wrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })
    pwaMocks.options?.onNeedRefresh?.()
    await nextTick()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '나중에')
      ?.trigger('click')

    expect(wrapper.find('[data-update-prompt]').exists()).toBe(false)
    expect(pwaMocks.updateServiceWorker).not.toHaveBeenCalled()
  })

  it('나중에 선택한 업데이트는 같은 세션의 새로고침에서 다시 안내하지 않는다', async () => {
    const wrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })
    pwaMocks.options?.onNeedRefresh?.()
    await nextTick()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '나중에')
      ?.trigger('click')
    wrapper.unmount()

    const reloadedWrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })
    pwaMocks.options?.onNeedRefresh?.()
    await nextTick()

    expect(reloadedWrapper.find('[data-update-prompt]').exists()).toBe(false)
  })

  it('서비스 워커 등록 직후와 화면 복귀 시 업데이트를 확인한다', () => {
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const registration = { update, waiting: null } as unknown as ServiceWorkerRegistration
    const wrapper = mount(PwaUpdatePrompt, { global: { stubs: globalStubs } })

    pwaMocks.options?.onRegisteredSW?.('/firebase-messaging-sw.js', registration)

    expect(update).toHaveBeenCalledOnce()

    document.dispatchEvent(new Event('visibilitychange'))
    expect(update).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })
})
