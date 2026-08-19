<script setup lang="ts">
import type { MerchantCategory } from '@/domains/map/api/merchants'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'

defineProps<{
  categories: MerchantCategory[]
  activeCategoryId: string | null
}>()

const emit = defineEmits<{
  select: [categoryId: string]
}>()

const open = defineModel<boolean>('open', { default: false })

function selectCategory(categoryId: string) {
  emit('select', categoryId)
  open.value = false
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="mx-auto w-full gap-0 rounded-t-lg border-0 px-5 pt-4 pb-[max(2.5rem,var(--safe-area-bottom))] sm:max-w-[430px]"
    >
      <div class="mx-auto h-1 w-10 rounded-full bg-divider" aria-hidden="true" />

      <div class="pt-5 pb-4">
        <SheetTitle class="text-heading font-bold text-charcoal">카테고리 선택</SheetTitle>
        <SheetDescription class="sr-only"
          >지도에서 찾을 가맹점 카테고리를 선택하세요</SheetDescription
        >
      </div>

      <div class="grid grid-cols-5 gap-y-4">
        <button
          v-for="category in categories"
          :key="category.categoryId"
          type="button"
          class="flex flex-col items-center gap-1.5"
          :aria-pressed="activeCategoryId === category.categoryId"
          @click="selectCategory(category.categoryId)"
        >
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-full"
            :class="
              activeCategoryId === category.categoryId
                ? 'bg-primary text-white'
                : 'bg-accent text-primary'
            "
          >
            <component
              :is="categoryIcon[category.categoryName] ?? DEFAULT_CATEGORY_ICON"
              class="size-5"
            />
          </span>
          <span
            class="text-caption text-center"
            :class="
              activeCategoryId === category.categoryId
                ? 'text-primary font-semibold'
                : 'text-charcoal'
            "
          >
            {{ category.categoryName }}
          </span>
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>
