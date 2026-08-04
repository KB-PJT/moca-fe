export interface HomeOwnedCard {
  id: string
  name: string
  imageUrl: string | null
  accentColor: string
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
    receivedBenefitAmount: 9_600,
    availableBenefitAmount: 3_400,
    performance: {
      currentAmount: 198_000,
      targetAmount: 300_000,
    },
  },
]
