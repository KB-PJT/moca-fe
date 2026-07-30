<script setup lang="ts">
import PageLayout from '@/shared/components/PageLayout.vue'

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <PageLayout v-bind="$attrs" class="[&>header]:h-13 [&>header]:shrink-0">
    <slot />

    <template v-if="$slots['app-bar-right']" #app-bar-right>
      <slot name="app-bar-right" />
    </template>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </PageLayout>
</template>
