import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'
import type { CardConnectionStatus, OwnedCard } from '@/domains/card/stores/ownedCards'

type MockConnectionResult = Extract<CardConnectionStatus, 'connected' | 'failed'>

interface MockCardConnection {
  issuer: CardIssuerId
  status: MockConnectionResult
  connectionDurationMs: number
  delayAfterMs: number
  reconnectDurationMs: number
  cards: Array<Omit<OwnedCard, 'issuer'>>
}

/**
 * 카드 일괄연동 플로우의 단일 mock 설정입니다.
 *
 * - status: 완료 화면에 표시할 성공/실패 결과
 * - connectionDurationMs: 해당 카드사가 '연결 중'으로 머무는 시간
 * - delayAfterMs: 다음 카드사 연결 전 잠시 멈추는 시간
 * - reconnectDurationMs: 실패 카드사 재연결에 걸리는 시간
 * - cards: 사용자 보유카드 목록
 *
 * TODO(API): 실제 연동 이후에는 런타임 데이터 소스에서 제외하고 개발/테스트 fixture로만 사용합니다.
 */
export const MOCK_CARD_CONNECTIONS: MockCardConnection[] = [
  {
    issuer: 'kb-kookmin',
    status: 'connected',
    connectionDurationMs: 850,
    delayAfterMs: 250,
    reconnectDurationMs: 1200,
    cards: [{ id: 'mock-kb-1', name: 'KB국민 My WE:SH 카드' }],
  },
  {
    issuer: 'shinhan',
    status: 'connected',
    connectionDurationMs: 1200,
    delayAfterMs: 450,
    reconnectDurationMs: 1200,
    cards: [{ id: 'mock-shinhan-1', name: '신한카드 Mr.Life' }],
  },
  {
    issuer: 'hyundai',
    status: 'connected',
    connectionDurationMs: 900,
    delayAfterMs: 200,
    reconnectDurationMs: 1300,
    cards: [{ id: 'mock-hyundai-1', name: '현대카드 ZERO Edition3' }],
  },
  {
    issuer: 'hana',
    status: 'connected',
    connectionDurationMs: 1450,
    delayAfterMs: 600,
    reconnectDurationMs: 1400,
    cards: [{ id: 'mock-hana-1', name: '하나 원더카드' }],
  },
  {
    issuer: 'samsung',
    status: 'failed',
    connectionDurationMs: 1050,
    delayAfterMs: 300,
    reconnectDurationMs: 1400,
    cards: [{ id: 'mock-samsung-1', name: '삼성 iD ON 카드' }],
  },
  {
    issuer: 'woori',
    status: 'connected',
    connectionDurationMs: 800,
    delayAfterMs: 500,
    reconnectDurationMs: 1200,
    cards: [{ id: 'mock-woori-1', name: '우리카드 DA@카드의정석' }],
  },
  {
    issuer: 'lotte',
    status: 'connected',
    connectionDurationMs: 1300,
    delayAfterMs: 250,
    reconnectDurationMs: 1300,
    cards: [{ id: 'mock-lotte-1', name: 'LOCA LIKIT 1.2' }],
  },
  {
    issuer: 'nh-nonghyup',
    status: 'connected',
    connectionDurationMs: 950,
    delayAfterMs: 350,
    reconnectDurationMs: 1200,
    cards: [{ id: 'mock-nh-1', name: 'NH올원 파이카드' }],
  },
  {
    issuer: 'bc-baro',
    status: 'connected',
    connectionDurationMs: 1000,
    delayAfterMs: 300,
    reconnectDurationMs: 1200,
    cards: [{ id: 'mock-bc-1', name: 'BC 바로 클리어 플러스 카드' }],
  },
]

export const MOCK_OWNED_CARDS: OwnedCard[] = MOCK_CARD_CONNECTIONS.flatMap((connection) =>
  connection.cards.map((card) => ({
    ...card,
    issuer: connection.issuer,
  })),
)

export function getMockCardConnection(issuerId: CardIssuerId) {
  return MOCK_CARD_CONNECTIONS.find((connection) => connection.issuer === issuerId)
}
