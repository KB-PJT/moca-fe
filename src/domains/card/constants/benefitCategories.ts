import type { Component } from 'vue'
import {
  BadgePercent,
  BusFront,
  Car,
  CarTaxiFront,
  Clapperboard,
  Coffee,
  Coins,
  Dumbbell,
  FerrisWheel,
  Fuel,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  Landmark,
  MonitorPlay,
  PawPrint,
  Plane,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Ticket,
  Utensils,
  WalletCards,
} from '@lucide/vue'

export interface CardBenefitIconSource {
  title: string
  summary?: string | null
  detailText?: string | null
}

interface CardBenefitCategoryDefinition {
  id: string
  label: string
  icon: Component
  keywords: readonly string[]
}

/** 제목·요약·상세에 포함된 가맹점 업종을 혜택 방식보다 우선한다. */
export const CARD_BENEFIT_CATEGORY_ICON_RULES = [
  {
    id: 'cafe',
    label: '카페·디저트',
    icon: Coffee,
    keywords: ['카페', '커피', '스타벅스', '투썸', '이디야', '폴바셋', '베이커리', '디저트'],
  },
  {
    id: 'convenience',
    label: '편의점',
    icon: Store,
    keywords: ['편의점', 'gs25', '세븐일레븐', '이마트24'],
  },
  {
    id: 'beauty',
    label: '뷰티·드럭스토어',
    icon: Sparkles,
    keywords: ['드럭스토어', '올리브영', '미용실', '뷰티', '화장품'],
  },
  {
    id: 'fuel',
    label: '주유·충전',
    icon: Fuel,
    keywords: ['주유', '충전소', 'lpg', 'sk에너지', 'gs칼텍스', 's-oil', '현대오일'],
  },
  {
    id: 'taxi',
    label: '택시',
    icon: CarTaxiFront,
    keywords: ['택시', '카카오 t', '우티'],
  },
  {
    id: 'transit',
    label: '대중교통',
    icon: BusFront,
    keywords: ['대중교통', '교통', '버스', '지하철', '철도', 'ktx', 'srt'],
  },
  {
    id: 'dining',
    label: '외식·배달',
    icon: Utensils,
    keywords: ['음식점', '외식', '식당', '배달', '배민', '요기요', '쿠팡이츠'],
  },
  {
    id: 'grocery',
    label: '슈퍼·마트',
    icon: ShoppingCart,
    keywords: ['슈퍼', '대형마트', '이마트', '홈플러스', '롯데마트'],
  },
  {
    id: 'shopping',
    label: '쇼핑',
    icon: ShoppingBag,
    keywords: ['쇼핑', '백화점', '온라인몰', '쿠팡', '네이버쇼핑', '홈쇼핑'],
  },
  {
    id: 'subscription',
    label: '구독·스트리밍',
    icon: MonitorPlay,
    keywords: ['구독', '정기결제', 'ott', '넷플릭스', '유튜브', '디즈니', '티빙', '웨이브'],
  },
  {
    id: 'game',
    label: '게임',
    icon: Gamepad2,
    keywords: ['게임', '게임스토어', '구글플레이', '앱스토어', 'playstation', 'xbox'],
  },
  {
    id: 'telecom',
    label: '통신',
    icon: Smartphone,
    keywords: ['통신', '통신요금', '이동통신', '휴대폰', 'skt', 'lg u+'],
  },
  {
    id: 'utilities',
    label: '공과금',
    icon: ReceiptText,
    keywords: ['공과금', '관리비', '전기요금', '도시가스', '수도요금'],
  },
  {
    id: 'finance',
    label: '금융',
    icon: Landmark,
    keywords: ['금융', '은행', '보험', '증권', '수수료', '이자'],
  },
  {
    id: 'easy-pay',
    label: '간편결제',
    icon: WalletCards,
    keywords: ['간편결제', 'kb pay', '카카오페이', '네이버페이', '페이코'],
  },
  {
    id: 'travel',
    label: '여행·항공',
    icon: Plane,
    keywords: ['항공', '여행', '해외', '면세', '공항'],
  },
  {
    id: 'accommodation',
    label: '숙박',
    icon: Hotel,
    keywords: ['숙박', '호텔', '리조트', '모텔'],
  },
  {
    id: 'pet',
    label: '반려동물',
    icon: PawPrint,
    keywords: ['반려동물', '동물병원', '펫'],
  },
  {
    id: 'medical',
    label: '의료·건강',
    icon: HeartPulse,
    keywords: ['의료', '병원', '약국', '건강검진'],
  },
  {
    id: 'education',
    label: '교육·도서',
    icon: GraduationCap,
    keywords: ['교육', '학원', '도서', '서점', '학습'],
  },
  {
    id: 'movie',
    label: '영화',
    icon: Clapperboard,
    keywords: ['영화', 'cgv', '메가박스', '롯데시네마'],
  },
  {
    id: 'theme-park',
    label: '테마파크',
    icon: FerrisWheel,
    keywords: ['테마파크', '놀이공원', '에버랜드', '롯데월드', '서울랜드'],
  },
  {
    id: 'culture',
    label: '공연·전시',
    icon: Ticket,
    keywords: ['문화', '공연', '전시', '인터파크 티켓'],
  },
  {
    id: 'leisure',
    label: '레저·스포츠',
    icon: Dumbbell,
    keywords: ['레저', '스포츠', '골프', '피트니스', '헬스'],
  },
  {
    id: 'auto',
    label: '자동차',
    icon: Car,
    keywords: ['자동차', '정비', '주차', '하이패스', '렌터카'],
  },
  {
    id: 'life',
    label: '생활',
    icon: House,
    keywords: ['생활', '생활비', 'life 서비스', 'life service'],
  },
] as const satisfies readonly CardBenefitCategoryDefinition[]

/** 가맹점 업종을 판별할 수 없을 때 사용하는 혜택 방식 폴백이다. */
export const CARD_BENEFIT_TYPE_ICON_RULES = [
  {
    id: 'rewards',
    label: '적립·리워드',
    icon: Coins,
    keywords: ['적립', '포인트', '마일리지', '캐시백', '리워드'],
  },
  {
    id: 'discount',
    label: '할인',
    icon: BadgePercent,
    keywords: ['할인'],
  },
] as const satisfies readonly CardBenefitCategoryDefinition[]

export const DEFAULT_CARD_BENEFIT_CATEGORY = {
  id: 'general',
  label: '일반 혜택',
  icon: BadgePercent,
  keywords: [],
} as const satisfies CardBenefitCategoryDefinition

export type CardBenefitCategory =
  | (typeof CARD_BENEFIT_CATEGORY_ICON_RULES)[number]
  | (typeof CARD_BENEFIT_TYPE_ICON_RULES)[number]
  | typeof DEFAULT_CARD_BENEFIT_CATEGORY

export function resolveCardBenefitCategory(source: CardBenefitIconSource): CardBenefitCategory {
  const title = source.title.trim().toLowerCase()
  const summary = source.summary?.trim().toLowerCase() ?? ''
  const detailText = source.detailText?.trim().toLowerCase() ?? ''

  const titleCategory = CARD_BENEFIT_CATEGORY_ICON_RULES.find((category) =>
    category.keywords.some((keyword) => title.includes(keyword)),
  )
  if (titleCategory) return titleCategory

  const summaryCategory = CARD_BENEFIT_CATEGORY_ICON_RULES.find((category) =>
    category.keywords.some((keyword) => summary.includes(keyword)),
  )
  if (summaryCategory) return summaryCategory

  const titleBenefitType = CARD_BENEFIT_TYPE_ICON_RULES.find((category) =>
    category.keywords.some((keyword) => title.includes(keyword)),
  )
  if (titleBenefitType) return titleBenefitType

  const summaryBenefitType = CARD_BENEFIT_TYPE_ICON_RULES.find((category) =>
    category.keywords.some((keyword) => summary.includes(keyword)),
  )
  if (summaryBenefitType) return summaryBenefitType

  const detailCategory = CARD_BENEFIT_CATEGORY_ICON_RULES.find((category) =>
    category.keywords.some((keyword) => detailText.includes(keyword)),
  )
  if (detailCategory) return detailCategory

  return (
    CARD_BENEFIT_TYPE_ICON_RULES.find((category) =>
      category.keywords.some((keyword) => detailText.includes(keyword)),
    ) ?? DEFAULT_CARD_BENEFIT_CATEGORY
  )
}

export function resolveCardBenefitIcon(source: CardBenefitIconSource): Component {
  return resolveCardBenefitCategory(source).icon
}
