import { Coffee, ShoppingBag, ShoppingCart, Utensils } from '@lucide/vue'
import type { Merchant } from '@/domains/map/api/merchants.mock'

// 가맹점 헤더, 목록 항목 등 카테고리 아이콘이 필요한 모든 곳에서 공통으로 쓴다.
export const categoryIcon: Record<Merchant['category'], typeof Utensils> = {
  음식점: Utensils,
  카페: Coffee,
  편의점: ShoppingBag,
  마트: ShoppingCart,
}
