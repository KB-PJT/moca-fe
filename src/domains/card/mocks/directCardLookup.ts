import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'
import type { DiscoveredCard } from '@/domains/card/stores/directCardConnection'

interface MockDirectCardLookup {
  durationMs: number
  cards: DiscoveredCard[]
}

const CARD_FIXTURES: Record<
  CardIssuerId,
  Array<Pick<DiscoveredCard, 'id' | 'name' | 'last4' | 'cardColor'>>
> = {
  'kb-kookmin': [
    { id: 'direct-kb-1', name: 'KB My WE:SH', last4: '4321', cardColor: '#173D73' },
    { id: 'direct-kb-2', name: 'KB 청춘대로 티타늄', last4: '9988', cardColor: '#245A91' },
    { id: 'direct-kb-3', name: 'KB 국민 알뜰', last4: '1122', cardColor: '#D9E2EC' },
  ],
  hyundai: [
    { id: 'direct-hyundai-1', name: '현대카드 ZERO Edition3', last4: '2741', cardColor: '#111827' },
    { id: 'direct-hyundai-2', name: '현대카드 M', last4: '8604', cardColor: '#5B6472' },
  ],
  woori: [
    { id: 'direct-woori-1', name: '우리카드 DA@카드의정석', last4: '7218', cardColor: '#2468B4' },
    { id: 'direct-woori-2', name: '카드의정석 EVERY POINT', last4: '3150', cardColor: '#7A4D32' },
  ],
  samsung: [
    { id: 'direct-samsung-1', name: '삼성 iD ON 카드', last4: '6042', cardColor: '#234EA0' },
    { id: 'direct-samsung-2', name: '삼성 iD SIMPLE 카드', last4: '1849', cardColor: '#C8D1E0' },
  ],
  'nh-nonghyup': [
    { id: 'direct-nh-1', name: 'NH올원 파이카드', last4: '9051', cardColor: '#17845B' },
    { id: 'direct-nh-2', name: 'NH zgm.play 카드', last4: '3374', cardColor: '#6157A6' },
  ],
  'bc-baro': [
    { id: 'direct-bc-1', name: 'BC 바로 클리어 플러스', last4: '5820', cardColor: '#D9363E' },
    { id: 'direct-bc-2', name: 'BC 바로 On&Off', last4: '1467', cardColor: '#292D38' },
  ],
  shinhan: [
    { id: 'direct-shinhan-1', name: '신한카드 Mr.Life', last4: '4492', cardColor: '#3767B1' },
    { id: 'direct-shinhan-2', name: '신한카드 Deep Dream', last4: '7083', cardColor: '#513E86' },
  ],
  lotte: [
    { id: 'direct-lotte-1', name: 'LOCA LIKIT 1.2', last4: '2639', cardColor: '#20242B' },
    { id: 'direct-lotte-2', name: 'LOCA 365', last4: '8175', cardColor: '#B73538' },
  ],
  hana: [
    { id: 'direct-hana-1', name: '하나 원더카드', last4: '3906', cardColor: '#158784' },
    { id: 'direct-hana-2', name: '하나 Any PLUS 카드', last4: '5248', cardColor: '#5A716E' },
  ],
}

export function getMockDirectCardLookup(issuerId: CardIssuerId): MockDirectCardLookup {
  return {
    durationMs: 1800,
    cards: CARD_FIXTURES[issuerId].map((card) => ({ ...card, issuer: issuerId })),
  }
}
