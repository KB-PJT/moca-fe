export interface RecentBenefitItem {
  id: string
  merchantName: string
  benefitType: '할인'
  description: string
  cardName: string
  benefitAmount: number
  paymentAmount: number
}

// TODO(API): 최근 전체 혜택 내역 조회 API 응답으로 교체한다.
export const MOCK_RECENT_BENEFITS: RecentBenefitItem[] = [
  {
    id: 'starbucks-20250713',
    merchantName: '스타벅스',
    benefitType: '할인',
    description: '카페 10% 할인',
    cardName: 'KB My WE:SH',
    benefitAmount: 1_500,
    paymentAmount: 15_000,
  },
  {
    id: 'gs25-20250712',
    merchantName: 'GS25',
    benefitType: '할인',
    description: '편의점 10% 할인',
    cardName: 'KB My WE:SH',
    benefitAmount: 800,
    paymentAmount: 8_000,
  },
  {
    id: 'netflix-20250710',
    merchantName: '넷플릭스',
    benefitType: '할인',
    description: '구독서비스 할인',
    cardName: 'KB My WE:SH',
    benefitAmount: 2_000,
    paymentAmount: 17_000,
  },
]
