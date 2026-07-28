<script setup lang="ts">
import MocaButton from './MocaButton.vue'

interface Props {
  title: string
  description?: string
  actionLabel?: string
}

defineProps<Props>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 p-8 text-center">
    <slot name="icon" />
    <p class="text-subheading text-charcoal">{{ title }}</p>
    <p v-if="description" class="text-body text-gray">{{ description }}</p>
    <MocaButton v-if="actionLabel" @click="emit('action')">
      {{ actionLabel }}
    </MocaButton>
  </div>
</template>
