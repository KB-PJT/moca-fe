<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
import PwaUpdatePrompt from '@/shared/components/PwaUpdatePrompt.vue'
</script>

<template>
  <ConfigProvider teleport-to="#app-shell">
    <div
      id="app-shell"
      class="relative mx-auto h-dvh max-w-97.5 overflow-hidden bg-white transform-[translateZ(0)]"
    >
      <RouterView />
      <PwaUpdatePrompt />
    </div>
  </ConfigProvider>
</template>
