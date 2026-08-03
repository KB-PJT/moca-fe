<script setup lang="ts">
import PwaUpdatePrompt from '@/shared/components/PwaUpdatePrompt.vue'
</script>

<template>
  <div class="mx-auto h-dvh max-w-97.5 overflow-hidden bg-white">
    <RouterView />
    <PwaUpdatePrompt />
  </div>
</template>
