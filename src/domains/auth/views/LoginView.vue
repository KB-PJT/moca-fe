<script setup lang="ts">
import googleLogoUrl from '@/domains/auth/assets/google-logo.svg'
import { startGoogleLogin } from '@/domains/auth/utils/pkce'
import MocaButton from '@/shared/components/MocaButton.vue'

function handleGoogleLogin() {
  void startGoogleLogin()
}
</script>

<template>
  <main class="flex min-h-dvh flex-col bg-white">
    <section class="relative flex-1 overflow-hidden px-7 pt-12">
      <h1 class="text-display text-charcoal">안녕하세요!</h1>
      <p class="mt-1 text-subheading font-medium text-gray">계속하려면 로그인하세요</p>

      <div
        aria-hidden="true"
        class="absolute left-1/2 top-52 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-card"
      >
        <img :src="googleLogoUrl" alt="" class="size-6" />
      </div>

      <div
        aria-hidden="true"
        class="absolute left-1/2 top-52 ml-12 h-20 w-32 rotate-12 rounded-md border border-primary/20 bg-primary/10"
      />
      <div
        aria-hidden="true"
        class="absolute left-1/2 top-64 ml-12 h-16 w-28 rounded-md border border-divider bg-white/80"
      />
    </section>

    <footer class="border-t border-divider px-5 pb-16 pt-5">
      <MocaButton
        variant="ghost"
        block
        class="h-14 justify-start rounded-md border bg-white px-5 text-subheading text-charcoal shadow-none hover:bg-screen"
        @click="handleGoogleLogin"
      >
        <img :src="googleLogoUrl" alt="" class="size-5 shrink-0" />
        <span class="flex-1 text-center">구글로 시작하기</span>
        <span aria-hidden="true" class="size-5 shrink-0" />
      </MocaButton>
    </footer>
  </main>
</template>
