<script setup lang="ts">
interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
})
</script>

<template>
  <header class="-mx-5 -mt-6 mb-6 border-b border-divider px-5 py-4">
    <h1 class="text-heading text-charcoal">{{ title }}</h1>
  </header>
</template>
