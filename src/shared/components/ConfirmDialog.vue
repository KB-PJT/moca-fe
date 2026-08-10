<script setup lang="ts">
import MocaButton from '@/shared/components/MocaButton.vue'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: '확인',
  cancelLabel: '취소',
  destructive: false,
  loading: false,
  errorMessage: '',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  cancel: []
  confirm: []
}>()

function updateOpen(open: boolean) {
  if (!open && props.loading) return
  emit('update:open', open)
}

function confirm() {
  if (props.loading) return
  emit('confirm')
}
</script>

<template>
  <AlertDialog :open="open" @update:open="updateOpen">
    <AlertDialogContent class="w-[calc(100%-2rem)] max-w-85 sm:max-w-85">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
        <p v-if="errorMessage" class="text-caption text-error" role="alert">
          {{ errorMessage }}
        </p>
      </AlertDialogHeader>
      <AlertDialogFooter class="grid grid-cols-2">
        <AlertDialogCancel as-child class="mt-0">
          <MocaButton variant="secondary" block :disabled="loading" @click="emit('cancel')">
            {{ cancelLabel }}
          </MocaButton>
        </AlertDialogCancel>
        <MocaButton
          block
          :aria-label="`${confirmLabel} 확인`"
          :loading="loading"
          :class="destructive ? 'bg-error! text-white! hover:bg-error/90!' : ''"
          @click="confirm"
        >
          {{ confirmLabel }}
        </MocaButton>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
