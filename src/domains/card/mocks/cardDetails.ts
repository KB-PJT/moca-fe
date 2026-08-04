export type CardBenefitIcon = 'cafe' | 'convenience' | 'transit' | 'subscription'

export interface CardDetailBenefit {
  id: string
  icon: CardBenefitIcon
  category: string
  title: string
  condition: string
  description?: string
}

export interface CardDetailData {
  id: string
  name: string
  issuerName: string
  last4: string
  imageUrl: string | null
  description: string
  updatedAt: string
  benefits: CardDetailBenefit[]
  noticeHtml: string
}

const DEFAULT_BENEFITS: CardDetailBenefit[] = [
  {
    id: 'cafe',
    icon: 'cafe',
    category: '카페',
    title: '10% 할인',
    condition: '월 최대 5,000원',
    description:
      '스타벅스·이디야·투썸플레이스 등 카페 가맹점 결제 시 10% 할인 · 전월 실적 30만원 이상 시 적용',
  },
  {
    id: 'convenience',
    icon: 'convenience',
    category: '편의점',
    title: '5% 할인',
    condition: '건당 1만원 이상 결제 시',
    description: 'GS25·CU 등 편의점 가맹점에서 건당 1만원 이상 결제 시 5% 할인',
  },
  {
    id: 'transit',
    icon: 'transit',
    category: '대중교통',
    title: '10% 할인',
    condition: '전월 실적 40만원 이상',
    description: '버스·지하철 이용 금액의 10% 할인 · 전월 실적 40만원 이상 시 적용',
  },
  {
    id: 'subscription',
    icon: 'subscription',
    category: '구독',
    title: '5% 할인',
    condition: '월 최대 3,000원',
    description: '넷플릭스·유튜브 프리미엄 등 정기 구독 결제 시 5% 할인',
  },
]

const DEFAULT_NOTICE_HTML = `
  <h3>할인서비스 적용 안내</h3>
  <ul>
    <li>할인서비스는 환급할인으로 제공됩니다.</li>
    <li>체크카드 환급할인은 이용전표가 매입처리 완료된 후 할인금액을 카드 출금계좌로 환급하는 방식입니다.</li>
    <li>본인 회원 기준으로 월간 할인 한도가 제공되며, 할인 한도는 매월 1일부터 말일까지 이용한 금액을 기준으로 적용됩니다.</li>
  </ul>
`

export const MOCK_CARD_DETAILS: CardDetailData[] = [
  {
    id: 'home-kb-wesh',
    name: 'KB My WE:SH',
    issuerName: 'KB국민카드',
    last4: '4321',
    imageUrl: null,
    description: '커피·편의점·대중교통 혜택에 특화된 일상형 카드',
    updatedAt: '오늘 09:32',
    benefits: DEFAULT_BENEFITS,
    noticeHtml: DEFAULT_NOTICE_HTML,
  },
  {
    id: 'home-kb-taptap',
    name: 'KB국민 청춘대로 톡톡카드',
    issuerName: 'KB국민카드',
    last4: '1024',
    imageUrl: null,
    description: '커피와 간편결제 혜택을 자주 이용하는 생활형 카드',
    updatedAt: '오늘 09:28',
    benefits: DEFAULT_BENEFITS,
    noticeHtml: DEFAULT_NOTICE_HTML,
  },
  {
    id: 'home-shinhan-mrlife',
    name: '신한카드 Mr.Life',
    issuerName: '신한카드',
    last4: '8847',
    imageUrl: null,
    description: '공과금과 생활비 할인에 특화된 생활 밀착형 카드',
    updatedAt: '오늘 09:20',
    benefits: DEFAULT_BENEFITS,
    noticeHtml: DEFAULT_NOTICE_HTML,
  },
  {
    id: 'home-hyundai-zero',
    name: '현대카드 ZERO Edition3',
    issuerName: '현대카드',
    last4: '2291',
    imageUrl: null,
    description: '조건 없이 기본 할인을 받을 수 있는 실속형 카드',
    updatedAt: '오늘 09:15',
    benefits: DEFAULT_BENEFITS,
    noticeHtml: DEFAULT_NOTICE_HTML,
  },
]

export function getMockCardDetail(cardId: string) {
  return MOCK_CARD_DETAILS.find((card) => card.id === cardId)
}
