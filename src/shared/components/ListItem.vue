<script setup lang="ts">
interface Props {
  title: string
  description?: string
  clickable?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '',
  clickable: false,
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    v-if="clickable"
    type="button"
    class="flex w-full items-center gap-4 border-b border-divider px-5 py-4 text-left last:border-b-0 hover:bg-screen"
    @click="emit('click')"
  >
    <slot name="left" />
    <span class="min-w-0 flex-1">
      <span class="block text-body font-semibold text-charcoal">{{ title }}</span>
      <span v-if="description" class="mt-1 block text-label font-normal text-gray">
        {{ description }}
      </span>
    </span>
    <slot name="right" />
  </button>

  <div
    v-else
    class="flex w-full items-center gap-4 border-b border-divider px-5 py-4 text-left last:border-b-0"
  >
    <slot name="left" />
    <span class="min-w-0 flex-1">
      <span class="block text-body font-semibold text-charcoal">{{ title }}</span>
      <span v-if="description" class="mt-1 block text-label font-normal text-gray">
        {{ description }}
      </span>
    </span>
    <slot name="right" />
  </div>
</template>
