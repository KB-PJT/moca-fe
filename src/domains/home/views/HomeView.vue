<script setup lang="ts">
import { Button } from '@/shared/ui/button'
</script>

<template>
  <div class="space-y-3 p-4">
    <p class="text-display">38,200원</p>
    <p class="text-body text-gray">2025.06.28 · 카드 결제</p>
    <Button class="w-full">연결 시작하기</Button>
    <Button variant="outline" class="border-primary text-primary bg-card w-full">
      나중에 하기
    </Button>
    <div class="bg-screen border-divider shadow-card rounded-md p-4">카드 영역</div>
  </div>
</template>
