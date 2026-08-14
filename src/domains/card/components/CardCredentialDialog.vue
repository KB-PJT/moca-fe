<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SubmitCardCredentialsRequest } from '@/domains/card/api/cardLinks'
import BasePasswordInput from '@/shared/components/BasePasswordInput.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

interface Props {
  open: boolean
  cardName: string
  cardNo?: string | null
  errors?: Record<string, string>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cardNo: null,
  errors: () => ({}),
  loading: false,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  submit: [request: SubmitCardCredentialsRequest]
}>()

const cardNumber = ref('')
const cardPassword = ref('')
const displayedCardNumber = computed(() => cardNumber.value.replace(/(\d{4})(?=\d)/g, '$1 '))
const canSubmit = computed(
  () => cardNumber.value.length === 16 && cardPassword.value.length === 4 && !props.loading,
)

watch(
  () => [props.open, props.cardName],
  ([open]) => {
    if (open) resetValues()
  },
)

function updateCardNumber(value: string | number) {
  cardNumber.value = String(value).replace(/\D/g, '').slice(0, 16)
}

function updateCardPassword(value: string) {
  cardPassword.value = value.replace(/\D/g, '').slice(0, 4)
}

function resetValues() {
  cardNumber.value = ''
  cardPassword.value = ''
}

function updateOpen(open: boolean) {
  if (!props.loading) emit('update:open', open)
}

function submit() {
  if (!canSubmit.value) return

  emit('submit', {
    cardNo: cardNumber.value,
    ...(cardPassword.value ? { cardPassword: cardPassword.value } : {}),
  })
}
</script>

<template>
  <Dialog :open="open" @update:open="updateOpen">
    <DialogContent class="max-w-90" :show-close-button="!loading">
      <DialogHeader>
        <DialogTitle>카드 정보를 확인해 주세요</DialogTitle>
        <DialogDescription class="leading-relaxed text-gray">
          <span class="font-semibold text-primary">{{ cardName }}</span>
          <span> 활성화에 필요한 정보를 입력해 주세요.</span>
          <span v-if="cardNo" class="mt-1 block">조회된 카드번호: {{ cardNo }}</span>
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <label for="card-credential-number" class="text-body text-charcoal">
            카드번호 <span class="text-error">*</span>
          </label>
          <Input
            id="card-credential-number"
            :model-value="displayedCardNumber"
            type="text"
            inputmode="numeric"
            maxlength="19"
            autocomplete="off"
            placeholder="카드번호 전체를 입력해 주세요"
            class="rounded-sm!"
            :aria-invalid="Boolean(errors.cardNo)"
            @update:model-value="updateCardNumber"
          />
          <p v-if="errors.cardNo" class="text-caption text-error" role="alert">
            {{ errors.cardNo }}
          </p>
        </div>

        <BasePasswordInput
          :model-value="cardPassword"
          label="카드 비밀번호 4자리"
          required
          :maxlength="4"
          placeholder="4자리 입력"
          :error="errors.cardPassword"
          input-class="rounded-sm!"
          @update:model-value="updateCardPassword"
        />

        <p v-if="errors.form" class="text-caption text-error" role="alert">
          {{ errors.form }}
        </p>

        <DialogFooter class="grid grid-cols-2 sm:grid-cols-2">
          <MocaButton
            type="button"
            variant="secondary"
            :disabled="loading"
            @click="updateOpen(false)"
          >
            취소
          </MocaButton>
          <MocaButton type="submit" :disabled="!canSubmit" :loading="loading">
            확인하기
          </MocaButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
