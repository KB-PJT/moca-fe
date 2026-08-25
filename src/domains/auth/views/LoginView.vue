<script setup lang="ts">
import { ChartColumn, CreditCard, Sparkles, Wallet } from '@lucide/vue'
import googleLogoUrl from '@/domains/auth/assets/google-logo.svg'
import { startGoogleLogin } from '@/domains/auth/utils/pkce'
import MocaButton from '@/shared/components/MocaButton.vue'

function handleGoogleLogin() {
  void startGoogleLogin()
}
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10">
    <span
      aria-hidden="true"
      class="brand-badge flex size-20 shrink-0 items-center justify-center rounded-[22px]"
    >
      <Wallet class="size-9 text-white" :stroke-width="2.25" />
    </span>

    <h1 class="brand-wordmark mt-6 text-[70px] font-extrabold tracking-tight">MOCA</h1>

    <p class="mt-5 text-subheading font-medium text-gray">최적의 카드를 찾아주는 서비스</p>

    <div class="mt-8 flex flex-wrap justify-center gap-2">
      <span class="feature-pill">
        <Sparkles class="size-3.5 text-primary" :stroke-width="2.5" />
        혜택 발견
      </span>
      <span class="feature-pill">
        <CreditCard class="size-3.5 text-primary" :stroke-width="2.5" />
        순위 분석
      </span>
      <span class="feature-pill">
        <ChartColumn class="size-3.5 text-primary" :stroke-width="2.5" />
        월별 리포트
      </span>
    </div>

    <MocaButton
      variant="ghost"
      block
      class="relative mt-10 h-14 justify-center rounded-full border border-gray/30 bg-white text-subheading! text-charcoal shadow-btn hover:bg-screen"
      @click="handleGoogleLogin"
    >
      <img :src="googleLogoUrl" alt="" class="absolute left-6 top-1/2 size-5 -translate-y-1/2" />
      <span>구글로 시작하기</span>
    </MocaButton>
  </main>
</template>

<style scoped>
.brand-badge {
  background: linear-gradient(135deg, #ffb067 0%, #ff8836 50%, #f2701c 100%);
}

.brand-wordmark {
  line-height: 1;
  background: linear-gradient(135deg, #ffd9ad 0%, #ffb067 50%, #ff8836 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--color-divider);
  background: var(--color-screen);
  padding: 0.375rem 0.75rem;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-charcoal);
}
</style>
