<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Check, X } from '@lucide/vue'
import type { ConditionItem, ConditionStatus } from '@/domains/map/types/benefitCondition'

interface Props {
  items: ConditionItem[]
  // 마운트 등장 애니메이션을 items가 바뀔 때마다 다시 재생할지. 기본은 마운트 1회만.
  animateOnUpdate?: boolean
  // 첫 항목이 등장을 시작하기까지 대기 시간(ms). 이 리스트를 감싸는 바깥 컨테이너가
  // 자체 진입 애니메이션(예: 바텀시트가 펼쳐지는 트랜지션)을 갖고 있을 때, 리스트가
  // 마운트되자마자 바로 시작해버리면 컨테이너 애니메이션 도중에 조용히 다 끝나버려서
  // "다 열리고 나서야 시작하는" 것처럼 보인다. 그 컨테이너 트랜지션과 겹치도록 호출부에서
  // 맞춰 넘긴다.
  startDelayMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  animateOnUpdate: false,
  startDelayMs: 0,
})

// 'na'(해당 없음)는 조건을 판단할 근거가 없다는 뜻이라 목록엔 보여줄 정보가 없다.
// 타입·데이터엔 그대로 두고, 렌더할 때만 충족/미충족 항목으로 걸러낸다.
const visibleItems = computed(() => props.items.filter((item) => item.status !== 'na'))

const STATUS_LABEL: Record<ConditionStatus, string> = {
  met: '충족',
  unmet: '미충족',
  na: '해당 없음',
}

// met: 채워진 원 / unmet·na: 테두리만 있는 빈 원. 채움 여부로 "완료됐는지"를 먼저 읽고,
// 색으로 미충족(경고)과 해당 없음(중립)을 구분한다.
const CIRCLE_CLASS: Record<ConditionStatus, string> = {
  met: 'bg-success border-success text-white',
  unmet: 'bg-card border-warning text-warning',
  na: 'bg-card border-disabled text-disabled',
}

const TITLE_CLASS: Record<ConditionStatus, string> = {
  met: 'text-charcoal font-bold',
  unmet: 'text-charcoal font-bold',
  na: 'text-disabled font-normal',
}

// 마운트(또는 animateOnUpdate 시 items 변경) 시 opacity/translateY만 바꿔 위→아래로
// 순차 등장시킨다. 두 프레임을 기다렸다가 뒤집는 건, 그 사이 브라우저가 "가려진" 시작
// 상태를 한 번 그려야 opacity/transform 전환이 실제로 발생하기 때문이다(동기 토글 시
// 시작 상태가 아예 그려지지 않아 트랜지션이 생략될 수 있음).
const hasEntered = ref(false)

function playEnterAnimation() {
  hasEntered.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hasEntered.value = true
    })
  })
}

onMounted(playEnterAnimation)

watch(
  () => props.items,
  () => {
    if (props.animateOnUpdate) playEnterAnimation()
  },
)
</script>

<template>
  <ol class="flex flex-col gap-4">
    <li
      v-for="(item, index) in visibleItems"
      :key="item.key"
      class="relative flex gap-4 transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0"
      :class="hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
      :style="{ transitionDelay: `${startDelayMs + index * 70}ms` }"
    >
      <!-- 연결선은 li 자체에 absolute로 붙여서, 패딩/gap 때문에 다음 원 앞에서 선이
           끊겨 보이는 걸 막는다(원 바로 아래부터 다음 li 시작 지점까지 정확히 닿음).
           li의 opacity/transform을 그대로 물려받아 별도 애니메이션 없이 항목과 같이 등장한다. -->
      <span
        v-if="index < visibleItems.length - 1"
        class="border-divider absolute top-6 -bottom-4 left-3 border-l-2"
        aria-hidden="true"
      />

      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-full border-2"
        :class="CIRCLE_CLASS[item.status]"
      >
        <Check v-if="item.status === 'met'" class="size-4" aria-hidden="true" />
        <X v-else class="size-4" aria-hidden="true" />
        <span class="sr-only">{{ STATUS_LABEL[item.status] }}</span>
      </span>

      <div class="min-w-0 flex-1">
        <p class="text-body" :class="TITLE_CLASS[item.status]">{{ item.title }}</p>
        <p v-if="item.description" class="text-caption text-gray mt-1">
          {{ item.description }}
        </p>
      </div>
    </li>
  </ol>
</template>
