import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

function mountDialog(destructive = false) {
  return mount(ConfirmDialog, {
    attachTo: document.body,
    props: {
      open: true,
      title: '카드를 삭제할까요?',
      description: '삭제한 카드는 복구할 수 없어요.',
      confirmLabel: '삭제',
      destructive,
    },
  })
}

function getButton(label: string) {
  const button = [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  )

  if (!button) throw new Error(`${label} 버튼을 찾을 수 없습니다.`)
  return button
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('취소 버튼을 누르면 cancel 이벤트와 닫힘 변경을 보낸다', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.$nextTick()

    getButton('취소').click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toContainEqual([false])
  })

  it('2열 버튼 배치에서 취소 버튼의 모바일 상단 여백을 제거한다', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.$nextTick()

    expect(getButton('취소').classList).toContain('mt-0')
    expect(getButton('취소').classList).not.toContain('mt-2')
  })

  it('확인 버튼을 누르면 confirm 이벤트와 닫힘 변경을 보낸다', async () => {
    const wrapper = mountDialog()
    await wrapper.vm.$nextTick()

    getButton('삭제').click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toContainEqual([false])
  })

  it('destructive 확인 버튼에 위험 동작 스타일을 적용한다', async () => {
    const wrapper = mountDialog(true)
    await wrapper.vm.$nextTick()

    expect(getButton('삭제').classList).toContain('bg-error!')
  })
})
