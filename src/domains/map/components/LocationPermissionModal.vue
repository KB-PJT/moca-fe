<script setup lang="ts">
import { Navigation } from '@lucide/vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface Props {
  open: boolean
  loading?: boolean
  error?: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:open': [value: boolean]; allow: []; later: [] }>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :show-close-button="false" class="w-[calc(100%-2rem)] max-w-85 sm:max-w-85">
      <DialogHeader class="items-center sm:text-center">
        <span
          class="bg-accent text-primary mb-1 flex size-12 items-center justify-center rounded-full"
        >
          <Navigation class="size-6" />
        </span>
        <DialogTitle>위치 기반 서비스 이용</DialogTitle>
        <DialogDescription>
          주변 혜택 가맹점을 추천하기 위해<br />
          현재 위치 접근 권한이 필요합니다.
        </DialogDescription>
        <p v-if="error" class="text-caption text-error">{{ error }}</p>
      </DialogHeader>
      <DialogFooter class="grid grid-cols-2">
        <MocaButton variant="secondary" block :disabled="loading" @click="emit('later')">
          나중에
        </MocaButton>
        <MocaButton block :loading="loading" @click="emit('allow')">허용하기</MocaButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
