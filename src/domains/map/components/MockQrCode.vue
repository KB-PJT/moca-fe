<script setup lang="ts">
import { computed } from 'vue'

// 실제 스캔 가능한 QR은 아니고, "QR이 떴다"는 걸 보여주기 위한 목업 패턴이다.
// 매번 렌덤하게 바뀌면 화면이 지저분해 보여서, 고정된 시드로 결정적으로 생성한다.
const GRID_SIZE = 17
const MODULE = 6
const FINDER_SIZE = 7

interface FinderOrigin {
  row: number
  col: number
}

const finders: FinderOrigin[] = [
  { row: 0, col: 0 },
  { row: 0, col: GRID_SIZE - FINDER_SIZE },
  { row: GRID_SIZE - FINDER_SIZE, col: 0 },
]

function isInsideFinder(row: number, col: number): boolean {
  return finders.some(
    (f) => row >= f.row && row < f.row + FINDER_SIZE && col >= f.col && col < f.col + FINDER_SIZE,
  )
}

// 파인더 패턴(모서리 사각 링) 모양: 바깥 테두리 + 안쪽 3x3 채움.
function finderFill(row: number, col: number): boolean {
  const f = finders.find(
    (f) => row >= f.row && row < f.row + FINDER_SIZE && col >= f.col && col < f.col + FINDER_SIZE,
  )!
  const localRow = row - f.row
  const localCol = col - f.col
  const isBorder = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6
  const isCenter = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4
  return isBorder || isCenter
}

// 고정 시드 의사난수 — 매 렌더 같은 패턴이 나오게 한다.
function seededFill(row: number, col: number): boolean {
  const seed = row * 928371 + col * 12007 + row * col * 37
  return seed % 5 < 2
}

const modules = computed(() => {
  const cells: { x: number; y: number; filled: boolean }[] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const filled = isInsideFinder(row, col) ? finderFill(row, col) : seededFill(row, col)
      cells.push({ x: col * MODULE, y: row * MODULE, filled })
    }
  }
  return cells
})

const size = GRID_SIZE * MODULE
</script>

<template>
  <svg
    :viewBox="`0 0 ${size} ${size}`"
    :width="size"
    :height="size"
    role="img"
    aria-label="결제용 QR 코드"
  >
    <rect :width="size" :height="size" fill="white" />
    <rect
      v-for="cell in modules"
      :key="`${cell.x}-${cell.y}`"
      v-show="cell.filled"
      :x="cell.x"
      :y="cell.y"
      :width="MODULE"
      :height="MODULE"
      fill="#2f2f2f"
    />
  </svg>
</template>
