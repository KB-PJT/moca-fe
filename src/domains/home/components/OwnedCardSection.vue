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

    <div class="mt-5">
      <slot />
    </div>
  </section>
</template>
