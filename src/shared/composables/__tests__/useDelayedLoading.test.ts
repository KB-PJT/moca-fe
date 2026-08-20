import { nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDelayedLoading } from '@/shared/composables/useDelayedLoading'

describe('useDelayedLoading', () => {
  afterEach(() => vi.useRealTimers())

  it('빠른 로딩에는 표시하지 않고 지연 시간이 지난 경우에만 표시한다', async () => {
    vi.useFakeTimers()
    const isLoading = ref(true)
    const isVisible = useDelayedLoading(() => isLoading.value)

    vi.advanceTimersByTime(199)
    expect(isVisible.value).toBe(false)

    isLoading.value = false
    await nextTick()
    vi.advanceTimersByTime(1)
    expect(isVisible.value).toBe(false)

    isLoading.value = true
    await nextTick()
    vi.advanceTimersByTime(200)
    expect(isVisible.value).toBe(true)

    isLoading.value = false
    await nextTick()
    expect(isVisible.value).toBe(false)
  })
})
