import apiClient from '@/shared/api/client'

// 지도 화면에서 쓰는 가맹점 뷰모델. /merchants/nearby 실제 응답(merchantId, name, latitude,
// longitude, distanceMeters)에 아래 MOCK_MERCHANT_SUPPLEMENTS를 merchantId 기준으로 덧붙여 채운다.
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
  // 실제 응답에는 없는 UI 목업 전용 필드. 실제 영업시간 API가 생기면 교체.
  // mock에 매칭되지 않으면 영업 여부를 알 수 없으므로 null(정보 없음)로 둔다. true/false로
  // 단정하면 실제로는 모르는 상태를 아는 것처럼 보여주게 된다.
  isOpen: boolean | null
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

// hasBenefit/bestBenefit/address/isOpen은 nearby 응답에 아직 없는 필드라, 백엔드에 계산 API가
// 생기기 전까지 merchantId가 겹치는 아래 mock 데이터를 임시로 붙여 보여준다. 계산 API가 생기면
// MOCK_MERCHANT_SUPPLEMENTS와 mockSupplementByMerchantId, toMerchant()의 supplement 부분을 지우면 된다.
const MOCK_MERCHANT_SUPPLEMENTS: Merchant[] = [
  {
    placeId: '1',
    name: '군자관 학생식당',
    category: '음식점',
    distance: 120,
    address: '서울 광진구 군자동 1',
    latitude: 37.5487,
    longitude: 127.0741,
    hasBenefit: true,
    bestBenefit: {
      cardId: 21,
      cardName: '신한카드 Deep Dream',
      estimatedBenefit: 3000,
      baselineAmount: 30000,
      benefitLabel: '10% 할인',
    },
    isOpen: false,
  },
  {
    placeId: '2',
    name: '세종대 벤치커피',
    category: '카페',
    distance: 260,
    address: '서울 광진구 군자동 2',
    latitude: 37.5495,
    longitude: 127.0735,
    hasBenefit: true,
    bestBenefit: {
      cardId: 15,
      cardName: 'KB My WE:SH',
      estimatedBenefit: 690,
      baselineAmount: 6900,
      benefitLabel: '10% 할인',
    },
    isOpen: true,
  },
  {
    placeId: '3',
    name: 'CU 세종대점',
    category: '편의점',
    distance: 340,
    address: '서울 광진구 화양동 3',
    latitude: 37.547,
    longitude: 127.073,
    hasBenefit: false,
    isOpen: true,
  },
  {
    placeId: '4',
    name: '이마트24 능동로점',
    category: '마트',
    distance: 410,
    address: '서울 광진구 화양동 4',
    latitude: 37.546,
    longitude: 127.0725,
    hasBenefit: true,
    bestBenefit: {
      cardId: 33,
      cardName: '현대카드 M',
      estimatedBenefit: 2150,
      baselineAmount: 43000,
      benefitLabel: '5% 적립',
    },
    isOpen: true,
  },
  // 아래 3개는 클러스터링 테스트용으로 placeId 1 근처에 몰아넣은 목데이터
  {
    placeId: '5',
    name: '군자동 떡볶이',
    category: '음식점',
    distance: 125,
    address: '서울 광진구 군자동 1-1',
    latitude: 37.5488,
    longitude: 127.0742,
    hasBenefit: false,
    isOpen: true,
  },
  {
    placeId: '6',
    name: '메가커피 군자점',
    category: '카페',
    distance: 130,
    address: '서울 광진구 군자동 1-2',
    latitude: 37.5486,
    longitude: 127.074,
    hasBenefit: true,
    bestBenefit: {
      cardId: 42,
      cardName: '삼성카드 taptap O',
      estimatedBenefit: 1050,
      baselineAmount: 7000,
      benefitLabel: '15% 할인',
    },
    isOpen: true,
  },
  {
    placeId: '7',
    name: 'GS25 군자역점',
    category: '편의점',
    distance: 118,
    address: '서울 광진구 군자동 1-3',
    latitude: 37.5489,
    longitude: 127.074,
    hasBenefit: true,
    bestBenefit: {
      cardId: 58,
      cardName: '롯데카드 LOCA',
      estimatedBenefit: 500,
      baselineAmount: 10000,
      benefitLabel: '5% 적립',
    },
    isOpen: true,
  },
]

const mockSupplementByMerchantId = new Map(
  MOCK_MERCHANT_SUPPLEMENTS.map((merchant) => [merchant.placeId, merchant]),
)

export function toMerchant(item: NearbyMerchant, categoryName: string): Merchant {
  const supplement = mockSupplementByMerchantId.get(item.merchantId)

  return {
    placeId: item.merchantId,
    name: item.name,
    // 카테고리는 이미 어떤 categoryId로 조회했는지 알고 있으니 API 응답이 항상 우선이다.
    // mock category로 덮어쓰면 백엔드 카테고리가 바뀌었을 때 화면이 실제와 어긋난다.
    category: categoryName,
    distance: item.distanceMeters,
    address: supplement?.address ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
    hasBenefit: supplement?.hasBenefit ?? false,
    bestBenefit: supplement?.bestBenefit,
    isOpen: supplement?.isOpen ?? null,
  }
}
