import { Coffee, ShoppingBag, ShoppingCart, Utensils } from '@lucide/vue'

// 가맹점 헤더, 목록 항목 등 카테고리 아이콘이 필요한 모든 곳에서 공통으로 쓴다.
// 카테고리는 이제 API에서 동적으로 내려오므로, 매핑에 없는 값은 DEFAULT_CATEGORY_ICON으로 대체한다.
export const DEFAULT_CATEGORY_ICON = Utensils

export const categoryIcon: Record<string, typeof Utensils> = {
  음식점: Utensils,
  카페: Coffee,
  편의점: ShoppingBag,
  마트: ShoppingCart,
}
