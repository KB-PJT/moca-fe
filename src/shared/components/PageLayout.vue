<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/shared/components/AppBar.vue'

interface Props {
  title?: string
  hideAppBar?: boolean
  showBack?: boolean
  transparent?: boolean
  hasBottomBar?: boolean
  bg?: 'background' | 'screen' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  hideAppBar: false,
  showBack: true,
  transparent: false,
  hasBottomBar: false,
  bg: 'background',
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()
const instance = getCurrentInstance()
const slots = useSlots()

function onBack() {
  // 부모가 @back을 직접 듣고 있으면 그쪽에 위임하고, 없으면 기본 동작으로 이전 화면으로 이동한다.
  if (instance?.vnode.props?.onBack) {
    emit('back')
  } else {
    router.back()
  }
}

const bgClass = {
  background: 'bg-background',
  screen: 'bg-screen',
  card: 'bg-card',
} as const

// hasBottomBar와 footer가 동시에 있으면 footer가 탭바(h-16) 위로 올라가야 하고,
// 본문도 탭바+footer 높이를 합친 만큼 여백을 확보해야 겹치지 않는다.
const mainPaddingClass = computed(() => {
  if (props.hasBottomBar && slots.footer) return 'pb-40'
  if (props.hasBottomBar) return 'pb-20'
  if (slots.footer) return 'pb-28'
  return ''
})

const footerPositionClass = computed(() => (props.hasBottomBar ? 'bottom-16' : 'bottom-0'))
</script>

<template>
  <div class="flex min-h-screen flex-col" :class="bgClass[props.bg]">
    <AppBar
      v-if="!hideAppBar"
      :title="title"
      :show-back="showBack"
      :transparent="props.transparent"
      @back="onBack"
    >
      <template #right>
        <slot name="app-bar-right" />
      </template>
    </AppBar>

    <main class="flex-1 px-5 py-6" :class="mainPaddingClass">
      <slot />
    </main>

    <div
      v-if="$slots.footer"
      class="border-divider bg-card fixed inset-x-0 mx-auto w-full max-w-97.5 border-t px-5 py-4"
      :class="footerPositionClass"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
