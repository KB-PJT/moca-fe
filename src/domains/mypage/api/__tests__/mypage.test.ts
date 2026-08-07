import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import { deleteMocaAccount } from '@/domains/mypage/api/mypage'

vi.mock('@/shared/api/client', () => ({
  default: {
    delete: vi.fn<(url: string, config: object) => Promise<void>>(),
  },
}))

describe('deleteMocaAccount', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockReset()
  })

  it.each([
    ['서비스 사용이 불편해요', 'inconvenient'],
    ['필요한 기능이 없어요', 'not_needed'],
    ['혜택 정보가 정확하지 않아요', 'incorrect_benefit'],
    ['개인정보가 걱정돼요', 'privacy_concern'],
    ['사용 빈도가 낮아요', 'low_usage'],
    ['기타', 'etc'],
  ])('화면의 탈퇴 사유 %s를 API 코드 %s로 변환한다', async (reason, reasonCode) => {
    vi.mocked(apiClient.delete).mockResolvedValue({} as never)

    await deleteMocaAccount(reason)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me', {
      data: {
        reason: reasonCode,
        reasonDetail: reason,
        confirmed: true,
      },
    })
  })

  it('사유를 선택하지 않으면 기타 사유로 전송한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({} as never)

    await deleteMocaAccount()

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me', {
      data: {
        reason: 'etc',
        reasonDetail: '선택 안 함',
        confirmed: true,
      },
    })
  })
})
