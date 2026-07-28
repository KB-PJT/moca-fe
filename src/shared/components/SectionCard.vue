<script setup lang="ts">
interface Props {
  title?: string
  flush?: boolean
}

withDefaults(defineProps<Props>(), {
  flush: false,
})
</script>

<template>
  <section class="mb-6">
    <div v-if="title || $slots.action" class="mb-2 flex items-center justify-between px-1">
      <h2 v-if="title" class="text-subheading text-charcoal">{{ title }}</h2>
      <slot name="action" />
    </div>

    <div class="bg-card shadow-tile rounded-md" :class="!flush && 'p-4'">
      <slot />
    </div>
  </section>
</template>
