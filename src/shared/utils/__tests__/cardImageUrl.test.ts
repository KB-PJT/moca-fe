import { describe, expect, it } from 'vitest'
import { optimizeCardImageUrl } from '@/shared/utils/cardImageUrl'

const CARD_IMAGE_URL = 'https://d1c5n4ri2guedi.cloudfront.net/card/sample-card.png'

describe('optimizeCardImageUrl', () => {
  it.each([
    [128, '128'],
    [384, '384'],
  ] as const)('허용된 카드 이미지를 %ipx 최적화 경로로 변환한다', (width, expectedWidth) => {
    const result = optimizeCardImageUrl(CARD_IMAGE_URL, width, true)
    const url = new URL(result!, 'https://moca.example.com')

    expect(url.pathname).toBe('/_vercel/image')
    expect(url.searchParams.get('url')).toBe(CARD_IMAGE_URL)
    expect(url.searchParams.get('w')).toBe(expectedWidth)
    expect(url.searchParams.get('q')).toBe('75')
  })

  it('배포 환경이 아니면 원본 URL을 유지한다', () => {
    expect(optimizeCardImageUrl(CARD_IMAGE_URL, 384, false)).toBe(CARD_IMAGE_URL)
  })

  it.each([
    'https://example.com/card/sample-card.png',
    'https://d1c5n4ri2guedi.cloudfront.net.example.com/card/sample-card.png',
    'http://d1c5n4ri2guedi.cloudfront.net/card/sample-card.png',
    'https://d1c5n4ri2guedi.cloudfront.net/profile/sample-card.png',
    'https://d1c5n4ri2guedi.cloudfront.net/card/sample-card.png?version=2',
    '/card/sample-card.png',
  ])('허용 범위 밖의 URL은 원본을 유지한다: %s', (source) => {
    expect(optimizeCardImageUrl(source, 384, true)).toBe(source)
  })

  it('빈 URL은 그대로 반환한다', () => {
    expect(optimizeCardImageUrl('  ', 384, true)).toBe('')
    expect(optimizeCardImageUrl(null, 384, true)).toBeUndefined()
  })
})
