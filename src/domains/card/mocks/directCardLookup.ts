import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'
import type { DiscoveredCard } from '@/domains/card/stores/directCardConnection'

interface MockDirectCardLookup {
  durationMs: number
  cards: DiscoveredCard[]
}

const CARD_FIXTURES: Record<
  CardIssuerId,
  Array<Pick<DiscoveredCard, 'id' | 'name' | 'last4' | 'imageUrl'>>
> = {
  'kb-kookmin': [
    { id: 'direct-kb-1', name: 'KB My WE:SH', last4: '4321' },
    { id: 'direct-kb-2', name: 'KB 청춘대로 티타늄', last4: '9988' },
    { id: 'direct-kb-3', name: 'KB 국민 알뜰', last4: '1122' },
  ],
  hyundai: [
    { id: 'direct-hyundai-1', name: '현대카드 ZERO Edition3', last4: '2741' },
    { id: 'direct-hyundai-2', name: '현대카드 M', last4: '8604' },
  ],
  woori: [
    { id: 'direct-woori-1', name: '우리카드 DA@카드의정석', last4: '7218' },
    { id: 'direct-woori-2', name: '카드의정석 EVERY POINT', last4: '3150' },
  ],
  samsung: [
    { id: 'direct-samsung-1', name: '삼성 iD ON 카드', last4: '6042' },
    { id: 'direct-samsung-2', name: '삼성 iD SIMPLE 카드', last4: '1849' },
  ],
  'nh-nonghyup': [
    { id: 'direct-nh-1', name: 'NH올원 파이카드', last4: '9051' },
    { id: 'direct-nh-2', name: 'NH zgm.play 카드', last4: '3374' },
  ],
  'bc-baro': [
    { id: 'direct-bc-1', name: 'BC 바로 클리어 플러스', last4: '5820' },
    { id: 'direct-bc-2', name: 'BC 바로 On&Off', last4: '1467' },
  ],
  shinhan: [
    { id: 'direct-shinhan-1', name: '신한카드 Mr.Life', last4: '4492' },
    { id: 'direct-shinhan-2', name: '신한카드 Deep Dream', last4: '7083' },
  ],
  lotte: [
    { id: 'direct-lotte-1', name: 'LOCA LIKIT 1.2', last4: '2639' },
    { id: 'direct-lotte-2', name: 'LOCA 365', last4: '8175' },
  ],
  hana: [
    { id: 'direct-hana-1', name: '하나 원더카드', last4: '3906' },
    { id: 'direct-hana-2', name: '하나 Any PLUS 카드', last4: '5248' },
  ],
}

export function getMockDirectCardLookup(issuerId: CardIssuerId): MockDirectCardLookup {
  return {
    durationMs: 1800,
    cards: CARD_FIXTURES[issuerId].map((card) => ({ ...card, issuer: issuerId })),
  }
}
