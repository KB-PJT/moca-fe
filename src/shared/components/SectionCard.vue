<script setup lang="ts">
interface Props {
  title?: string
  flush?: boolean
  shadow?: boolean
}

withDefaults(defineProps<Props>(), {
  flush: false,
  shadow: true,
})
</script>

<template>
  <section class="mb-6">
    <div v-if="title || $slots.action" class="mb-2 flex items-center justify-between px-1">
      <h2 v-if="title" class="text-subheading text-charcoal">{{ title }}</h2>
      <slot name="action" />
    </div>

    <div class="rounded-md bg-card" :class="[!flush && 'p-4', shadow && 'shadow-tile']">
      <slot />
    </div>
  </section>
</template>
