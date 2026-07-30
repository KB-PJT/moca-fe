<script setup lang="ts">
import BottomBar from '@/shared/components/BottomBar.vue'
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1">
      <RouterView />
    </div>
    <BottomBar />
  </div>
</template>
