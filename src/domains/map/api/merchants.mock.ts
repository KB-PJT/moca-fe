// MAP-001 (GET /api/v1/places/nearby) 응답 필드에 맞춘 목업 타입.
// 실제 API 연동 시 이 타입 그대로 유지하고 데이터만 fetch로 교체하면 된다.
export interface Merchant {
  placeId: string
  name: string
  category: '음식점' | '카페' | '편의점' | '마트'
  distance: number
  address: string
  latitude: number
  longitude: number
  hasBenefit: boolean
  bestBenefit?: {
    cardId: number
    cardName: string
    estimatedBenefit: number
  }
  // MAP-001 실제 응답에는 없는 UI 목업 전용 필드. 실제 영업시간 API가 생기면 교체.
  isOpen: boolean
}

export const merchants: Merchant[] = [
  {
    placeId: '1',
    name: '군자관 학생식당',
    category: '음식점',
    distance: 120,
    address: '서울 광진구 군자동 1',
    latitude: 37.5487,
    longitude: 127.0741,
    hasBenefit: true,
    bestBenefit: { cardId: 21, cardName: '신한카드 Deep Dream', estimatedBenefit: 3000 },
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
    bestBenefit: { cardId: 15, cardName: 'KB My WE:SH', estimatedBenefit: 690 },
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
    bestBenefit: { cardId: 33, cardName: '현대카드 M', estimatedBenefit: 1500 },
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
    bestBenefit: { cardId: 42, cardName: '삼성카드 taptap O', estimatedBenefit: 1050 },
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
    bestBenefit: { cardId: 58, cardName: '롯데카드 LOCA', estimatedBenefit: 500 },
    isOpen: true,
  },
]
