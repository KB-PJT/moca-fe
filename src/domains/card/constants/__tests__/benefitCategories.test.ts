import { describe, expect, it } from 'vitest'
import {
  BadgePercent,
  BusFront,
  Clapperboard,
  Coins,
  FerrisWheel,
  Fuel,
  Gamepad2,
  House,
  Landmark,
  ShoppingCart,
  Sparkles,
  Ticket,
  WalletCards,
} from '@lucide/vue'
import {
  resolveCardBenefitCategory,
  resolveCardBenefitIcon,
} from '@/domains/card/constants/benefitCategories'

describe('card benefit categories', () => {
  it.each([
    ['기본 포인트 적립', 'rewards', Coins],
    ['생활 서비스 할인', 'life', House],
    ['주유소 적립', 'fuel', Fuel],
    ['금융 수수료 우대', 'finance', Landmark],
    ['분류되지 않은 특별 혜택', 'general', BadgePercent],
  ])('%s 혜택에 맞는 카테고리와 아이콘을 반환한다', (title, categoryId, icon) => {
    const benefit = { title }

    expect(resolveCardBenefitCategory(benefit).id).toBe(categoryId)
    expect(resolveCardBenefitIcon(benefit)).toBe(icon)
  })

  it.each([
    ['캐시백', '슈퍼 이용 시 제공', 'grocery', ShoppingCart],
    ['할인', 'Special 서비스', 'discount', BadgePercent],
    ['멤버십포인트', 'Multi Membership', 'rewards', Coins],
  ])(
    '%s 혜택은 가맹점 업종을 우선하고 없으면 혜택 방식 아이콘을 반환한다',
    (title, summary, categoryId, icon) => {
      const benefit = { title, summary }

      expect(resolveCardBenefitCategory(benefit).id).toBe(categoryId)
      expect(resolveCardBenefitIcon(benefit)).toBe(icon)
    },
  )

  it('제목에 명시된 가맹점 카테고리를 상세문구가 덮어쓰지 않는다', () => {
    const benefit = {
      title: '생활',
      summary: '추가 포인트 적립',
      detailText: '카페를 포함한 생활 가맹점에서 제공',
    }

    expect(resolveCardBenefitCategory(benefit).id).toBe('life')
    expect(resolveCardBenefitIcon(benefit)).toBe(House)
  })

  it.each([
    ['캐시백', 'Life 서비스', '카페 가맹점에서도 제공', 'life', House],
    ['할인', 'Special 서비스', '편의점 이용 시 제공', 'discount', BadgePercent],
    ['멤버십포인트', 'Multi Membership', '뷰티 가맹점에서 적립', 'rewards', Coins],
  ])(
    '요약과 혜택 방식이 상세문구의 업종보다 우선한다',
    (title, summary, detailText, categoryId, icon) => {
      const benefit = { title, summary, detailText }

      expect(resolveCardBenefitCategory(benefit).id).toBe(categoryId)
      expect(resolveCardBenefitIcon(benefit)).toBe(icon)
    },
  )

  it.each([
    ['공연/전시', 'culture', Ticket],
    ['드럭스토어', 'beauty', Sparkles],
    ['게임', 'game', Gamepad2],
    ['영화', 'movie', Clapperboard],
    ['테마파크', 'theme-park', FerrisWheel],
    ['간편결제', 'easy-pay', WalletCards],
  ])('%s 가맹점 카테고리를 구분한다', (title, categoryId, icon) => {
    const benefit = { title }

    expect(resolveCardBenefitCategory(benefit).id).toBe(categoryId)
    expect(resolveCardBenefitIcon(benefit)).toBe(icon)
  })

  it('제목 외의 요약과 상세 설명도 카테고리 판별에 사용한다', () => {
    const benefit = {
      title: '10% 혜택',
      summary: '월 최대 5천원',
      detailText: '버스와 지하철 등 대중교통 이용 시 적용',
    }

    expect(resolveCardBenefitCategory(benefit).id).toBe('transit')
    expect(resolveCardBenefitIcon(benefit)).toBe(BusFront)
  })
})
