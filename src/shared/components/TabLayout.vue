<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomBar from '@/shared/components/BottomBar.vue'

const route = useRoute()

// 템플릿 표현식 안에 유니온 타입(string | undefined)을 그대로 캐스트하면 `|` 문자를
// vue-eslint-parser가 Vue 2 필터 문법으로 오인해 lint 에러가 난다. 스크립트에서
// 미리 계산해두면 그 문제도 없고, meta.transition(타입상 unknown)도 명확히 좁혀진다.
const transitionName = computed(() => route.meta.transition as string | undefined)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName">
          <KeepAlive include="MapView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
    <BottomBar v-if="!route.meta.hideBottomBar" />
  </div>
</template>

<style scoped>
/* "MOCA로 결제하기"처럼 시트가 이어서 위로 올라와 화면을 덮는 것처럼 보이게 하는 전환.
   다른 라우트는 meta.transition이 없어 이 클래스가 안 붙고 기존처럼 즉시 전환된다. */
.slide-up-enter-active,
.slide-up-leave-active {
  position: absolute;
  inset: 0;
  transition: transform 0.32s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: none;
  }
}
</style>
