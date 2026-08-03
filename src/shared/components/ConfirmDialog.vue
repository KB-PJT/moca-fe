<script setup lang="ts">
import MocaButton from '@/shared/components/MocaButton.vue'
import {
  AlertDialog,
  AlertDialogAction,
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
}

withDefaults(defineProps<Props>(), {
  confirmLabel: '확인',
  cancelLabel: '취소',
  destructive: false,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  cancel: []
  confirm: []
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent class="w-[calc(100%-2rem)] max-w-85 sm:max-w-85">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="grid grid-cols-2">
        <AlertDialogCancel as-child class="mt-0">
          <MocaButton variant="secondary" block @click="emit('cancel')">
            {{ cancelLabel }}
          </MocaButton>
        </AlertDialogCancel>
        <AlertDialogAction as-child>
          <MocaButton
            block
            :aria-label="`${confirmLabel} 확인`"
            :class="destructive ? 'bg-error! text-white! hover:bg-error/90!' : ''"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </MocaButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
