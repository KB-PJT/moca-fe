export interface HomeOwnedCard {
  id: string
  name: string
  imageUrl: string | null
  accentColor: string
  featuredBenefit: {
    title: string
    description: string
  }
  receivedBenefitAmount: number
  availableBenefitAmount: number
  performance: {
    currentAmount: number
    targetAmount: number
  }
}

// TODO(API): 홈 보유카드 조회 API 응답으로 교체한다.
export const MOCK_HOME_OWNED_CARDS: HomeOwnedCard[] = [
  {
    id: 'home-kb-wesh',
    name: 'KB My WE:SH',
    imageUrl: null,
    accentColor: '#ff9c70',
    featuredBenefit: {
      title: '스타벅스, 폴바셋 10% 할인',
      description: '월 최대 5천원',
    },
    receivedBenefitAmount: 21_800,
    availableBenefitAmount: 8_200,
    performance: {
      currentAmount: 382_000,
      targetAmount: 500_000,
    },
  },
  {
    id: 'home-kb-taptap',
    name: 'KB국민 청춘대로 톡톡카드',
    imageUrl: null,
    accentColor: '#5fc8e8',
    featuredBenefit: {
      title: '스타벅스 최대 60% 할인',
      description: '월 최대 1만원',
    },
    receivedBenefitAmount: 16_400,
    availableBenefitAmount: 6_600,
    performance: {
      currentAmount: 241_000,
      targetAmount: 300_000,
    },
  },
  {
    id: 'home-shinhan-mrlife',
    name: '신한카드 Mr.Life',
    imageUrl: null,
    accentColor: '#7762df',
    featuredBenefit: {
      title: '공과금 10% 할인',
      description: '월 최대 1만원',
    },
    receivedBenefitAmount: 12_300,
    availableBenefitAmount: 4_700,
    performance: {
      currentAmount: 267_000,
      targetAmount: 300_000,
    },
  },
  {
    id: 'home-hyundai-zero',
    name: '현대카드 ZERO Edition3',
    imageUrl: null,
    accentColor: '#4c535d',
    featuredBenefit: {
      title: '국내외 가맹점 0.8% 할인',
      description: '할인 한도 없음',
    },
    receivedBenefitAmount: 9_600,
    availableBenefitAmount: 3_400,
    performance: {
      currentAmount: 198_000,
      targetAmount: 300_000,
    },
  },
]
