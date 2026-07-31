<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import type {
  CardConnectionField,
  CardConnectionFieldKey,
} from '@/domains/card/constants/cardConnection'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface Props {
  title: string
  fields: readonly CardConnectionField[]
  values: Record<CardConnectionFieldKey, string>
  errors: Partial<Record<CardConnectionFieldKey, string>>
  visiblePasswords: Partial<Record<CardConnectionFieldKey, boolean>>
}

defineProps<Props>()

const emit = defineEmits<{
  update: [field: CardConnectionField, value: string | number]
  blur: [field: CardConnectionField]
  togglePassword: [fieldKey: CardConnectionFieldKey]
}>()

function displayValue(field: CardConnectionField, value: string) {
  if (field.format === 'card-number') return value.replace(/(\d{4})(?=\d)/g, '$1 ')
  return value
}

function inputType(
  field: CardConnectionField,
  visiblePasswords: Partial<Record<CardConnectionFieldKey, boolean>>,
) {
  if (field.inputType !== 'password') return 'text'
  return visiblePasswords[field.key] ? 'text' : 'password'
}

function inputMaxLength(field: CardConnectionField) {
  if (field.format === 'card-number') return 19
  return field.maxLength
}

function descriptionId(fieldKey: CardConnectionFieldKey) {
  return `card-connection-${fieldKey}-description`
}
</script>

<template>
  <section>
    <h2 class="text-caption font-medium text-gray">{{ title }}</h2>
    <div
      class="mt-2 divide-y divide-divider overflow-hidden rounded-md border border-border bg-card shadow-tile"
    >
      <div v-for="field in fields" :key="field.key" class="px-4 py-3">
        <label
          :for="`card-connection-${field.key}`"
          class="flex items-center gap-1 text-caption text-gray"
        >
          {{ field.label }}
          <span class="rounded-xs bg-error/8 px-1.5 py-0.5 text-micro text-error">필수</span>
        </label>
        <div class="relative mt-1">
          <Input
            :id="`card-connection-${field.key}`"
            :model-value="displayValue(field, values[field.key])"
            :type="inputType(field, visiblePasswords)"
            :autocomplete="field.autocomplete"
            :maxlength="inputMaxLength(field)"
            :inputmode="field.numeric ? 'numeric' : undefined"
            :placeholder="field.placeholder"
            required
            aria-required="true"
            :aria-invalid="Boolean(errors[field.key])"
            :aria-describedby="
              errors[field.key] || field.helperText ? descriptionId(field.key) : undefined
            "
            class="h-7 border-0 bg-transparent p-0 pr-9 text-body font-semibold shadow-none focus-visible:border-0 focus-visible:ring-0"
            @update:model-value="(value) => emit('update', field, value)"
            @blur="emit('blur', field)"
          />
          <Button
            v-if="field.inputType === 'password'"
            type="button"
            variant="ghost"
            size="icon-xs"
            class="absolute -top-0.5 right-0 text-gray hover:bg-transparent"
            :aria-label="
              visiblePasswords[field.key] ? `${field.label} 숨기기` : `${field.label} 보기`
            "
            @click="emit('togglePassword', field.key)"
          >
            <EyeOff v-if="visiblePasswords[field.key]" />
            <Eye v-else />
          </Button>
        </div>
        <p
          v-if="errors[field.key]"
          :id="descriptionId(field.key)"
          class="mt-1 text-caption text-error"
          role="alert"
        >
          {{ errors[field.key] }}
        </p>
        <p
          v-else-if="field.helperText"
          :id="descriptionId(field.key)"
          class="mt-1 text-caption text-gray"
        >
          {{ field.helperText }}
        </p>
      </div>
    </div>
  </section>
</template>
