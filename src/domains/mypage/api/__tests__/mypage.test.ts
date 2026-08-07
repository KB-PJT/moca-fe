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

  it('화면의 탈퇴 사유를 API 요청 형식으로 변환한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({} as never)

    await deleteMocaAccount('서비스 사용이 불편해요')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me', {
      data: {
        reason: 'inconvenient',
        reasonDetail: '서비스 사용이 불편해요',
        confirmed: true,
      },
    })
  })
})
