<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ChartBar, House, MapPin, User } from '@lucide/vue'

const route = useRoute()

const tabs = [
  { label: '홈', to: '/home', icon: House },
  { label: '지도', to: '/map', icon: MapPin },
  { label: '혜택', to: '/report', icon: ChartBar },
  { label: '마이페이지', to: '/mypage', icon: User },
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <nav
    class="border-divider bg-background fixed inset-x-0 bottom-0 z-20 mx-auto flex h-16 max-w-97.5 items-center justify-around border-t"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-1 flex-col items-center justify-center gap-1"
      :class="isActive(tab.to) ? 'text-primary' : 'text-gray'"
    >
      <component :is="tab.icon" class="size-6" />
      <span class="text-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
