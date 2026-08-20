import {
  Book,
  Brush,
  Building2,
  Clapperboard,
  Coffee,
  Croissant,
  Droplet,
  FerrisWheel,
  Fuel,
  Hamburger,
  ShoppingBag,
  ShoppingCart,
  Utensils,
} from '@lucide/vue'

// 가맹점 헤더, 목록 항목 등 카테고리 아이콘이 필요한 모든 곳에서 공통으로 쓴다.
// 카테고리는 이제 API에서 동적으로 내려오므로, 매핑에 없는 값은 DEFAULT_CATEGORY_ICON으로 대체한다.
export const DEFAULT_CATEGORY_ICON = Utensils

export const categoryIcon: Record<string, typeof Utensils> = {
  음식점: Utensils,
  카페: Coffee,
  편의점: ShoppingBag,
  대형마트: ShoppingCart,
  뷰티: Brush,
  주유소: Fuel,
  주유: Droplet,
  도서: Book,
  패스트푸드: Hamburger,
  테마파크: FerrisWheel,
  백화점: Building2,
  영화: Clapperboard,
  베이커리: Croissant,
}

// 자주 쓰는 카테고리를 앞에 두는 화면 표시 순서. 이 목록에 없는(=API에 새로 추가된) 카테고리는
// 여기 있는 카테고리들 뒤로 밀리며, 테마파크는 신규 카테고리보다도 항상 맨 뒤에 오도록 별도 처리한다.
const CATEGORY_DISPLAY_ORDER = [
  '편의점',
  '음식점',
  '카페',
  '뷰티',
  '베이커리',
  '대형마트',
  '주유소',
  '백화점',
  '영화',
]
const LAST_CATEGORY_NAME = '테마파크'

function categoryPriority(categoryName: string): number {
  if (categoryName === LAST_CATEGORY_NAME) return Number.POSITIVE_INFINITY

  const order = CATEGORY_DISPLAY_ORDER.indexOf(categoryName)
  return order === -1 ? CATEGORY_DISPLAY_ORDER.length : order
}

export function sortByCategoryOrder<T extends { categoryName: string }>(categories: T[]): T[] {
  return [...categories].sort(
    (a, b) => categoryPriority(a.categoryName) - categoryPriority(b.categoryName),
  )
}
