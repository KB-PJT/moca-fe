import { ref, watch, type WatchSource } from 'vue'

export function useDelayedLoading(source: WatchSource<boolean>, delay = 200) {
  const isVisible = ref(false)

  watch(
    source,
    (isLoading, _, onCleanup) => {
      if (!isLoading) {
        isVisible.value = false
        return
      }

      const timer = window.setTimeout(() => {
        isVisible.value = true
      }, delay)
      onCleanup(() => window.clearTimeout(timer))
    },
    { immediate: true },
  )

  return isVisible
}
