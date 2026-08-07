<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils/cn'

interface Props {
  modelValue: string
  label?: string
  error?: string
  required?: boolean
  maxlength?: number
  placeholder?: string
  inputClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
const visible = ref(false)
const inputType = computed(() => (visible.value ? 'text' : 'password'))
const toggleLabel = computed(() => (visible.value ? '비밀번호 숨기기' : '비밀번호 보기'))

function toggleVisible() {
  visible.value = !visible.value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="inputId" class="text-body text-charcoal">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <div class="relative">
      <Input
        :id="inputId"
        :model-value="modelValue"
        :type="inputType"
        :maxlength="maxlength"
        :placeholder="placeholder"
        autocomplete="off"
        :class="cn('pr-10', props.inputClass, error && 'border-error')"
        @update:model-value="(value) => emit('update:modelValue', String(value))"
      />
      <button
        type="button"
        :aria-label="toggleLabel"
        class="text-gray absolute inset-y-0 right-3 flex items-center"
        @click="toggleVisible"
      >
        <EyeOff v-if="visible" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </div>

    <p v-if="error" class="text-caption text-error">{{ error }}</p>
  </div>
</template>
