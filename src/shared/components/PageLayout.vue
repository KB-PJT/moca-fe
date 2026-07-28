<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/shared/components/AppBar.vue'

interface Props {
  title?: string
  hideAppBar?: boolean
  showBack?: boolean
  hasBottomBar?: boolean
  bg?: 'background' | 'screen' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  hideAppBar: false,
  showBack: true,
  hasBottomBar: false,
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
</script>

<template>
  <div class="flex min-h-screen flex-col" :class="bgClass[props.bg]">
    <AppBar v-if="!hideAppBar" :title="title" :show-back="showBack" @back="onBack">
      <template #right>
        <slot name="app-bar-right" />
      </template>
    </AppBar>

    <main class="flex-1 px-5 py-6" :class="[hasBottomBar && 'pb-20', $slots.footer && 'pb-28']">
      <slot />
    </main>

    <div
      v-if="$slots.footer"
      class="border-divider bg-card fixed inset-x-0 bottom-0 mx-auto w-full max-w-97.5 border-t px-5 py-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
