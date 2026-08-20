import { describe, expect, it } from 'vitest'
import {
  resolveNotificationPath,
  resolveNotificationRoute,
} from '@/domains/notification/utils/notificationNavigation'

describe('notification navigation', () => {
  it('실적 마감 알림은 해당 카드 상세로 이동한다', () => {
    const data = { type: 'PERFORMANCE_DEADLINE', userCardId: 'card/with space' }

    expect(resolveNotificationRoute(data)).toEqual({
      name: 'card-detail',
      params: { id: 'card/with space' },
      query: { from: 'notification' },
    })
    expect(resolveNotificationPath(data)).toBe('/cards/card%2Fwith%20space?from=notification')
  })

  it('시간대 혜택 type만 있어도 지도 화면으로 이동한다', () => {
    const data = { type: 'TIME_BASED_BENEFIT' }

    expect(resolveNotificationRoute(data)).toEqual({
      name: 'map',
      query: { from: 'notification' },
    })
    expect(resolveNotificationPath(data)).toBe('/map?from=notification')
  })

  it('MAP target만 있어도 지도 화면으로 이동한다', () => {
    const data = { target: 'MAP' }

    expect(resolveNotificationRoute(data)).toEqual({
      name: 'map',
      query: { from: 'notification' },
    })
    expect(resolveNotificationPath(data)).toBe('/map?from=notification')
  })

  it('실적 마감 알림에 카드 ID가 없으면 홈으로 이동한다', () => {
    const data = { type: 'PERFORMANCE_DEADLINE' }

    expect(resolveNotificationRoute(data)).toEqual({ name: 'home' })
    expect(resolveNotificationPath(data)).toBe('/home')
  })

  it('알 수 없는 알림은 홈으로 이동한다', () => {
    expect(resolveNotificationRoute({ type: 'UNKNOWN' })).toEqual({ name: 'home' })
    expect(resolveNotificationPath({ type: 'UNKNOWN' })).toBe('/home')
  })
})
