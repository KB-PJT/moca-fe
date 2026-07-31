<script setup lang="ts">
defineProps<{
  scanning?: boolean
}>()
</script>

<template>
  <svg
    viewBox="0 0 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="보유 카드를 찾는 중"
    :class="{ 'is-scanning': scanning }"
  >
    <circle cx="110" cy="110" r="82" fill="#F6F0E9" />
    <circle cx="110" cy="110" r="61" fill="#FBF8F4" />

    <g class="orbit orbit-back" aria-hidden="true">
      <circle cx="110" cy="28" r="5" fill="#E9DCCB" />
      <circle cx="192" cy="110" r="5" fill="#E9DCCB" />
      <circle cx="110" cy="192" r="5" fill="#E9DCCB" />
      <circle cx="28" cy="110" r="5" fill="#E9DCCB" />
    </g>

    <g class="orbit orbit-front" aria-hidden="true">
      <rect x="34" y="44" width="29" height="17" rx="4" fill="#C7A675" />
      <rect x="43" y="49" width="8" height="5" rx="1.5" fill="#E4D1B4" />
      <rect x="167" y="162" width="28" height="17" rx="4" fill="#FF9E5C" />
      <rect x="172" y="166" width="8" height="5" rx="1.5" fill="#FFD0B0" />
    </g>

    <g class="card-mark">
      <circle cx="110" cy="110" r="48" fill="white" stroke="#D8B98F" stroke-width="2" />
      <rect x="79" y="88" width="62" height="43" rx="9" fill="#FF8836" />
      <rect x="88" y="98" width="17" height="12" rx="3" fill="#FFB47F" />
      <rect x="88" y="116" width="32" height="4" rx="2" fill="#FFB47F" />
    </g>

    <g class="search-mark">
      <circle cx="157" cy="65" r="22" fill="white" stroke="#D8B98F" stroke-width="2" />
      <circle cx="154" cy="62" r="12" stroke="#FF7424" stroke-width="3" />
      <path d="M163 71L172 80" stroke="#FF7424" stroke-width="3" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.orbit,
.card-mark,
.search-mark {
  transform-box: fill-box;
  transform-origin: center;
}

.is-scanning .orbit-back {
  animation: orbit-spin 2.6s linear;
}

.is-scanning .orbit-front {
  animation: orbit-spin 2.6s linear reverse;
}

.is-scanning .card-mark {
  animation: card-pulse 1.3s ease-in-out 2;
}

.is-scanning .search-mark {
  animation: search-scan 1.3s ease-in-out 2;
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes card-pulse {
  50% {
    transform: scale(1.06);
  }
}

@keyframes search-scan {
  50% {
    transform: translate(-8px, 8px) rotate(-8deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-scanning .orbit-back,
  .is-scanning .orbit-front,
  .is-scanning .card-mark,
  .is-scanning .search-mark {
    animation: none;
  }
}
</style>
