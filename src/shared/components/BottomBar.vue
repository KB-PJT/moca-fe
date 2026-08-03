<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ChartBar, House, MapPin, User } from '@lucide/vue'

interface Props {
  activePath?: string
}

const props = defineProps<Props>()
const route = useRoute()

const tabs = [
  { label: '홈', to: '/home', icon: House },
  { label: '지도', to: '/map', icon: MapPin },
  { label: '혜택', to: '/report', icon: ChartBar },
  { label: '마이페이지', to: '/mypage', icon: User },
]

function isActive(to: string) {
  return (props.activePath ?? route.path) === to
}
</script>

<template>
  <nav
    class="border-divider bg-background mx-auto flex w-full shrink-0 items-start justify-around border-t pb-[var(--safe-area-bottom)]"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex h-16 flex-1 flex-col items-center justify-center gap-1"
      :class="isActive(tab.to) ? 'text-primary' : 'text-gray'"
    >
      <component :is="tab.icon" class="size-6" />
      <span class="text-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
