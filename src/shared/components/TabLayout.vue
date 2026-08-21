<script setup lang="ts">
import { useRoute } from 'vue-router'
import BottomBar from '@/shared/components/BottomBar.vue'

const route = useRoute()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1">
      <RouterView v-slot="{ Component }">
        <KeepAlive include="MapView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
    <BottomBar v-if="!route.meta.hideBottomBar" />
  </div>
</template>
