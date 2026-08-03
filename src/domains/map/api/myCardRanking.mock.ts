// 실제 API 스펙에 정확히 대응하는 엔드포인트가 아직 없는 UI 목업 전용 데이터.
// "이 가맹점에서 내가 보유한 카드들의 혜택 순위" — CARD-004(보유 카드 목록) + BEN-001(혜택 추정)을
// 조합한 형태의 응답이 될 가능성이 높음. 실제 API 나오면 이 타입 기준으로 교체.
export interface MyCardRankItem {
  rank: number
  cardName: string
  issuer: string
  performanceMet: boolean

  // 압축 시트 TOP3 미리보기에서 쓴다.
  benefitLabel: string

  // 상세 페이지 "내 카드 혜택 비교"에서 쓴다.
  // 조건을 충족하지 못했어도 "충족했다면 받았을" 예상 혜택 금액을 그대로 보여준다.
  estimatedBenefitAmount: number
  // performanceMet이 false인 카드에만 존재. 이 카드의 적용 조건(약관)을 보여줘서
  // 왜 아직 미충족인지 바로 이해할 수 있게 한다.
  terms?: string
}

// placeId 기준. cardRecommendationByPlaceId에 항목이 있는 가맹점만 존재.
export const myCardRankingByPlaceId: Record<string, MyCardRankItem[]> = {
  '1': [
    {
      rank: 1,
      cardName: 'Deep Dream',
      issuer: '신한카드',
      performanceMet: true,
      benefitLabel: '10% 할인',
      estimatedBenefitAmount: 3000,
    },
    {
      rank: 2,
      cardName: 'My WE:SH',
      issuer: 'KB국민카드',
      performanceMet: false,
      benefitLabel: '5% 할인',
      estimatedBenefitAmount: 2000,
      terms:
        'KB My WE:SH는 카페 업종 결제 시 10% 할인. 전월 실적 200,000원 이상 시 적용되며, 월 최대 1.5만원까지 할인돼요. 최소결제금액 10,000원 이상.',
    },
    {
      rank: 3,
      cardName: 'Zero Edition',
      issuer: '우리카드',
      performanceMet: true,
      benefitLabel: '0.5% 캐시백',
      estimatedBenefitAmount: 150,
    },
  ],
  '2': [
    {
      rank: 1,
      cardName: 'My WE:SH',
      issuer: 'KB국민카드',
      performanceMet: false,
      benefitLabel: '10% 할인',
      estimatedBenefitAmount: 690,
      terms:
        'KB My WE:SH는 카페 업종 결제 시 10% 할인. 전월 실적 200,000원 이상 시 적용되며, 월 최대 1.5만원까지 할인돼요. 최소결제금액 10,000원 이상.',
    },
    {
      rank: 2,
      cardName: 'Deep Dream',
      issuer: '신한카드',
      performanceMet: true,
      benefitLabel: '3% 적립',
      estimatedBenefitAmount: 450,
    },
    {
      rank: 3,
      cardName: 'Zero Edition',
      issuer: '우리카드',
      performanceMet: true,
      benefitLabel: '0.5% 캐시백',
      estimatedBenefitAmount: 100,
    },
  ],
  '4': [
    {
      rank: 1,
      cardName: '현대카드 M',
      issuer: '현대카드',
      performanceMet: false,
      benefitLabel: '5% 적립',
      estimatedBenefitAmount: 1500,
      terms:
        '현대카드 M은 마트 업종 결제 시 5% 적립. 전월 실적 300,000원 이상 시 적용되며, 월 최대 3만원까지 적립돼요. 최소결제금액 30,000원 이상.',
    },
    {
      rank: 2,
      cardName: 'Zero Edition',
      issuer: '우리카드',
      performanceMet: true,
      benefitLabel: '0.5% 캐시백',
      estimatedBenefitAmount: 50,
    },
    {
      rank: 3,
      cardName: 'My WE:SH',
      issuer: 'KB국민카드',
      performanceMet: true,
      benefitLabel: '1% 적립',
      estimatedBenefitAmount: 300,
    },
  ],
  '6': [
    {
      rank: 1,
      cardName: 'taptap O',
      issuer: '삼성카드',
      performanceMet: true,
      benefitLabel: '15% 할인',
      estimatedBenefitAmount: 1050,
    },
    {
      rank: 2,
      cardName: 'Deep Dream',
      issuer: '신한카드',
      performanceMet: true,
      benefitLabel: '5% 할인',
      estimatedBenefitAmount: 450,
    },
    {
      rank: 3,
      cardName: 'My WE:SH',
      issuer: 'KB국민카드',
      performanceMet: false,
      benefitLabel: '3% 할인',
      estimatedBenefitAmount: 270,
      terms:
        'KB My WE:SH는 카페 업종 결제 시 10% 할인. 전월 실적 200,000원 이상 시 적용되며, 월 최대 1.5만원까지 할인돼요. 최소결제금액 10,000원 이상.',
    },
  ],
  '7': [
    {
      rank: 1,
      cardName: 'LOCA',
      issuer: '롯데카드',
      performanceMet: true,
      benefitLabel: '5% 적립',
      estimatedBenefitAmount: 500,
    },
    {
      rank: 2,
      cardName: 'Zero Edition',
      issuer: '우리카드',
      performanceMet: true,
      benefitLabel: '0.5% 캐시백',
      estimatedBenefitAmount: 50,
    },
    {
      rank: 3,
      cardName: '현대카드 M',
      issuer: '현대카드',
      performanceMet: false,
      benefitLabel: '2% 적립',
      estimatedBenefitAmount: 240,
      terms:
        '현대카드 M은 마트 업종 결제 시 5% 적립. 전월 실적 300,000원 이상 시 적용되며, 월 최대 3만원까지 적립돼요. 최소결제금액 30,000원 이상.',
    },
  ],
}
