import apiClient from '@/shared/api/client'

// 지도 화면에서 쓰는 가맹점 뷰모델. /merchants/nearby 실제 응답(merchantId, name, latitude,
// longitude, distanceMeters, address)에 아래 MOCK_BENEFIT_SUPPLEMENTS를 merchantId 기준으로
// 덧붙여 채운다. 혜택 계산 API가 아직 없어 hasBenefit/bestBenefit만 mock으로 보강한다.
export interface Merchant {
  placeId: string
  name: string
  category: string
  distance: number
  address: string
  latitude: number
  longitude: number
  hasBenefit: boolean
  bestBenefit?: {
    cardId: number
    cardName: string
    estimatedBenefit: number
    // 실제 응답에는 없는 UI 목업 전용 필드. estimatedBenefit을 계산한 기준 결제 금액("N원 기준" 표시용).
    baselineAmount: number
    // 실제 응답에는 없는 UI 목업 전용 필드. myCardRanking.mock의 benefitLabel과 같은 표기 컨벤션("N% 할인/적립").
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

// hasBenefit/bestBenefit은 nearby 응답에 아직 없는 필드라, 백엔드에 혜택 계산 API가 생기기
// 전까지 merchantId가 겹치는 아래 mock 데이터를 임시로 붙여 보여준다. 계산 API가 생기면
// MOCK_BENEFIT_SUPPLEMENTS와 mockSupplementByMerchantId, toMerchant()의 supplement 부분을 지우면 된다.
interface BenefitSupplement {
  placeId: string
  hasBenefit: boolean
  bestBenefit?: Merchant['bestBenefit']
}

const MOCK_BENEFIT_SUPPLEMENTS: BenefitSupplement[] = [
  {
    placeId: '1',
    hasBenefit: true,
    bestBenefit: {
      cardId: 21,
      cardName: '신한카드 Deep Dream',
      estimatedBenefit: 3000,
      baselineAmount: 30000,
      benefitLabel: '10% 할인',
    },
  },
  {
    placeId: '2',
    hasBenefit: true,
    bestBenefit: {
      cardId: 15,
      cardName: 'KB My WE:SH',
      estimatedBenefit: 690,
      baselineAmount: 6900,
      benefitLabel: '10% 할인',
    },
  },
  {
    placeId: '3',
    hasBenefit: false,
  },
  {
    placeId: '4',
    hasBenefit: true,
    bestBenefit: {
      cardId: 33,
      cardName: '현대카드 M',
      estimatedBenefit: 2150,
      baselineAmount: 43000,
      benefitLabel: '5% 적립',
    },
  },
  // 아래 3개는 클러스터링 테스트용으로 placeId 1 근처에 몰아넣은 목데이터
  {
    placeId: '5',
    hasBenefit: false,
  },
  {
    placeId: '6',
    hasBenefit: true,
    bestBenefit: {
      cardId: 42,
      cardName: '삼성카드 taptap O',
      estimatedBenefit: 1050,
      baselineAmount: 7000,
      benefitLabel: '15% 할인',
    },
  },
  {
    placeId: '7',
    hasBenefit: true,
    bestBenefit: {
      cardId: 58,
      cardName: '롯데카드 LOCA',
      estimatedBenefit: 500,
      baselineAmount: 10000,
      benefitLabel: '5% 적립',
    },
  },
]

const mockSupplementByMerchantId = new Map(
  MOCK_BENEFIT_SUPPLEMENTS.map((supplement) => [supplement.placeId, supplement]),
)

export function toMerchant(item: NearbyMerchant, categoryName: string): Merchant {
  const supplement = mockSupplementByMerchantId.get(item.merchantId)

  return {
    // merchantId는 개별 매장이 아니라 브랜드 ID라, 검색 중심이 바뀌면 같은 merchantId가 전혀
    // 다른 지점을 가리킬 수 있다(예: GS25 A지점 -> GS25 B지점). 좌표까지 합쳐서 "이 특정 매장"을
    // 가리키는 고유 ID로 써야, 재검색 시 선택 상태가 엉뚱한 매장으로 조용히 바뀌지 않는다.
    placeId: `${item.merchantId}:${item.latitude}:${item.longitude}`,
    name: item.name,
    // 카테고리는 이미 어떤 categoryId로 조회했는지 알고 있으니 API 응답이 항상 우선이다.
    // mock category로 덮어쓰면 백엔드 카테고리가 바뀌었을 때 화면이 실제와 어긋난다.
    category: categoryName,
    distance: item.distanceMeters,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    hasBenefit: supplement?.hasBenefit ?? false,
    bestBenefit: supplement?.bestBenefit,
  }
}
