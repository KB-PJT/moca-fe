import apiClient from '@/shared/api/client'

// 지도 화면에서 쓰는 가맹점 뷰모델. /merchants/nearby 실제 응답(merchantId, name, latitude,
// longitude, distanceMeters, address)을 그대로 옮겨 담는다.
export interface Merchant {
  placeId: string
  // /merchants/{merchantId}/card-recommendations 등 API 호출에 쓰는 원본 가맹점 식별자.
  // placeId는 좌표까지 합친 합성 키라 API에 그대로 쓸 수 없어 따로 보관한다.
  merchantId: string
  name: string
  category: string
  distance: number
  address: string
  latitude: number
  longitude: number
  // 가맹점 목록(PlaceListRow)의 "예상 혜택" 배지용 필드. 목록 전체에 대한 혜택 일괄 조회
  // API(/merchants/card-recommendations)는 아직 연동하지 않아 항상 false/undefined이다.
  hasBenefit: boolean
  bestBenefit?: {
    cardId: number
    cardName: string
    estimatedBenefit: number
    baselineAmount: number
    benefitLabel: string
  }
}

export interface MerchantCategory {
  categoryId: string
  categoryCode: string
  categoryName: string
}

export interface MerchantBrand {
  merchantId: string
  name: string
}

export interface NearbyMerchant {
  merchantId: string
  name: string
  latitude: number
  longitude: number
  distanceMeters: number
  address: string
}

interface ApiListResponse<T> {
  data: T[]
}

export async function fetchMerchantCategories(): Promise<MerchantCategory[]> {
  const response = await apiClient.get<ApiListResponse<MerchantCategory>>(
    '/api/v1/merchants/categories',
  )
  return response.data.data
}

export async function fetchMerchantsByCategory(categoryId: string): Promise<MerchantBrand[]> {
  const response = await apiClient.get<ApiListResponse<MerchantBrand>>('/api/v1/merchants', {
    params: { categoryId },
  })
  return response.data.data
}

interface FetchNearbyMerchantsParams {
  categoryId: string
  latitude: number
  longitude: number
  radiusMeters?: number
  merchantId?: string
}

export async function fetchNearbyMerchants(
  params: FetchNearbyMerchantsParams,
): Promise<NearbyMerchant[]> {
  const response = await apiClient.get<ApiListResponse<NearbyMerchant>>(
    '/api/v1/merchants/nearby',
    { params },
  )
  return response.data.data
}

export function toMerchant(item: NearbyMerchant, categoryName: string): Merchant {
  return {
    // merchantId는 개별 매장이 아니라 브랜드 ID라, 검색 중심이 바뀌면 같은 merchantId가 전혀
    // 다른 지점을 가리킬 수 있다(예: GS25 A지점 -> GS25 B지점). 좌표까지 합쳐서 "이 특정 매장"을
    // 가리키는 고유 ID로 써야, 재검색 시 선택 상태가 엉뚱한 매장으로 조용히 바뀌지 않는다.
    placeId: `${item.merchantId}:${item.latitude}:${item.longitude}`,
    merchantId: item.merchantId,
    name: item.name,
    // 카테고리는 이미 어떤 categoryId로 조회했는지 알고 있으니 API 응답이 항상 우선이다.
    // mock category로 덮어쓰면 백엔드 카테고리가 바뀌었을 때 화면이 실제와 어긋난다.
    category: categoryName,
    distance: item.distanceMeters,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    hasBenefit: false,
    bestBenefit: undefined,
  }
}

// ─── 가맹점별 보유 카드 혜택 추천 ───────────────────────────────────────────

export type CardRecommendationReasonCode =
  | 'MERCHANT_BENEFIT_MATCHED'
  | 'PREVIOUS_SPEND'
  | 'MINIMUM_PAYMENT'
  | 'MONTHLY_LIMIT'

export interface CardRecommendationReason {
  code: CardRecommendationReasonCode
  satisfied: boolean
  currentValue: number | null
  requiredValue: number | null
  remainingValue: number | null
}

export interface RankedCardBenefit {
  rank: number
  userCardId: string
  cardName: string
  issuerName?: string
  cardImageUrl: string | null
  benefitTitle: string
  rewardType: string
  rewardUnit: 'percent' | 'KRW' | 'point' | 'mile'
  rewardValue: number
  estimatedValueKrw: number
  estimatedPaymentAmountKrw: number
  transactionMinKrw: number | null
  previousMonthSpendKrw: number
  requiredPreviousSpendKrw: number | null
  remainingPreviousSpendKrw: number
  monthlyLimitKrw: number | null
  monthlyUsedKrw: number
  monthlyRemainingKrw: number | null
  performanceMet: boolean
  recommendationReasons: CardRecommendationReason[]
}

export interface MerchantCardRecommendation {
  merchant: {
    merchantId: string | null
    name: string | null
    categoryCode: string | null
    categoryName: string | null
  }
  benefitPreferenceType: string
  recommendedCard: RankedCardBenefit | null
  recommendationAvailable: boolean
  rankedCards: RankedCardBenefit[]
}

interface ApiResponse<T> {
  data: T
}

export async function fetchMerchantCardRecommendations(
  merchantId: string,
  paymentAmount?: number,
): Promise<MerchantCardRecommendation> {
  const response = await apiClient.get<ApiResponse<MerchantCardRecommendation>>(
    `/api/v1/merchants/${merchantId}/card-recommendations`,
    { params: paymentAmount ? { paymentAmount } : undefined },
  )
  return response.data.data
}
