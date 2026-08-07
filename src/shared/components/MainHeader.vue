<script setup lang="ts">
interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
})
</script>

<template>
  <header
    class="-mx-5 -mt-6 mb-6 shrink-0 border-b border-divider bg-background pt-[var(--safe-area-top)]"
  >
    <div class="flex min-h-(--app-bar-height) items-center px-5 py-2">
      <slot>
        <h1 class="text-heading text-charcoal">{{ title }}</h1>
      </slot>
    </div>
  </header>
</template>
