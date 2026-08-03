import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PwaUpdatePrompt from '@/shared/components/PwaUpdatePrompt.vue'

const pwaMocks = vi.hoisted(() => ({
  options: null as { onNeedRefresh?: () => void } | null,
  updateServiceWorker: vi.fn<(reloadPage?: boolean) => Promise<void>>(),
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: { onNeedRefresh?: () => void }) => {
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
})
