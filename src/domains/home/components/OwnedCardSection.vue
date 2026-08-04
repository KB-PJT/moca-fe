<script setup lang="ts">
interface Props {
  cardCount: number
  activeIndex?: number
}

withDefaults(defineProps<Props>(), {
  activeIndex: 0,
})
</script>

<template>
  <section class="mb-6" aria-labelledby="owned-card-title">
    <div class="flex items-center justify-between px-5">
      <h2 id="owned-card-title" class="text-body font-semibold text-gray">보유 카드</h2>
      <RouterLink
        :to="{ name: 'card-manage', query: { from: 'home' } }"
        class="text-body font-semibold text-gray"
      >
        관리
      </RouterLink>
    </div>

    <div v-if="cardCount > 0" class="mt-3 flex h-2 items-center justify-center gap-2">
      <span
        v-for="index in cardCount"
        :key="index"
        data-card-indicator
        class="h-2 rounded-full transition-[width,background-color] duration-300 ease-out"
        :class="index - 1 === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-disabled'"
        aria-hidden="true"
      />
    </div>

    <div class="mt-5">
      <slot />
    </div>
  </section>
</template>
