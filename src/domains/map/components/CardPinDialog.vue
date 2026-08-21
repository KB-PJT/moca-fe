<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface Props {
  open: boolean
  cardName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
}>()

const PIN_LENGTH = 4
const KEYPAD_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'] as const

const pin = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) pin.value = ''
  },
)

function pressDigit(digit: number) {
  if (pin.value.length >= PIN_LENGTH) return
  pin.value += String(digit)

  // 실제 결제 검증이 아니라 목업이라, 4자리를 다 입력하면 값과 무관하게 통과시킨다.
  if (pin.value.length === PIN_LENGTH) {
    setTimeout(() => {
      emit('update:open', false)
      emit('confirm')
    }, 150)
  }
}

function backspace() {
  pin.value = pin.value.slice(0, -1)
}

function updateOpen(open: boolean) {
  emit('update:open', open)
}
</script>

<template>
  <Dialog :open="open" @update:open="updateOpen">
    <DialogContent class="max-w-90 gap-6">
      <DialogHeader>
        <DialogTitle class="text-center">결제 비밀번호를 입력해주세요</DialogTitle>
        <DialogDescription class="text-center">
          <span class="font-semibold text-primary">{{ cardName }}</span> 비밀번호 4자리
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-center gap-4" role="status" aria-live="polite">
        <span
          v-for="i in PIN_LENGTH"
          :key="i"
          class="size-3.5 rounded-full transition-colors"
          :class="pin.length >= i ? 'bg-primary' : 'bg-divider'"
        />
      </div>

      <div class="grid grid-cols-3 gap-2">
        <template v-for="(key, index) in KEYPAD_DIGITS" :key="index">
          <button
            v-if="key === 'backspace'"
            type="button"
            aria-label="한 자리 지우기"
            class="flex h-14 items-center justify-center rounded-full text-charcoal active:bg-accent"
            @click="backspace"
          >
            <Delete class="size-5" />
          </button>
          <button
            v-else-if="key !== null"
            type="button"
            class="h-14 rounded-full text-subheading font-semibold text-charcoal active:bg-accent"
            @click="pressDigit(key)"
          >
            {{ key }}
          </button>
          <div v-else aria-hidden="true" />
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
