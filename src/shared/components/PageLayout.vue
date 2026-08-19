<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/shared/components/AppBar.vue'

interface Props {
  title?: string
  hideAppBar?: boolean
  showBack?: boolean
  transparent?: boolean
  hasBottomBar?: boolean
  horizontalPadding?: boolean
  hideScrollbar?: boolean
  bg?: 'background' | 'screen' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  hideAppBar: false,
  showBack: true,
  transparent: false,
  hasBottomBar: false,
  horizontalPadding: true,
  hideScrollbar: true,
  bg: 'background',
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()
const instance = getCurrentInstance()

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

const footerPaddingClass = computed(() =>
  props.hasBottomBar ? 'pb-4' : 'pb-[max(1rem,var(--safe-area-bottom))]',
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col" :class="bgClass[props.bg]">
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

    <main
      class="min-h-0 flex-1 overflow-y-auto py-6"
      :class="[props.horizontalPadding && 'px-5', props.hideScrollbar && 'scrollbar-hide']"
    >
      <slot />
    </main>

    <div
      v-if="$slots.footer"
      class="border-divider bg-card shrink-0 border-t px-5 pt-4"
      :class="footerPaddingClass"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
