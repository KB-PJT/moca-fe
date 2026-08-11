import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/shared/api/client'
import { createInquiry, type CreateInquiryRequest } from '@/domains/mypage/api/inquiry'

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn<(url: string, request: CreateInquiryRequest) => Promise<unknown>>(),
  },
}))

describe('createInquiry', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('문의 등록 요청을 보내고 등록 결과를 반환한다', async () => {
    const request: CreateInquiryRequest = {
      inquiryType: 'card_link',
      title: '카드 연동이 안 돼요',
      content: '인증번호 입력 화면에서 계속 실패합니다.',
      replyEmail: 'kakao_jimin@kakao.com',
    }
    const responseData = {
      inquiryId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ...request,
      status: 'received' as const,
      createdAt: '2026-08-11T02:04:27.916Z',
    }
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: true, data: responseData },
    })

    await expect(createInquiry(request)).resolves.toEqual(responseData)
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/support/inquiries', request)
  })

  it('문의 등록 요청이 실패하면 오류를 그대로 전달한다', async () => {
    const request: CreateInquiryRequest = {
      inquiryType: 'card_link',
      title: '카드 연동이 안 돼요',
      content: '인증번호 입력 화면에서 계속 실패합니다.',
      replyEmail: 'kakao_jimin@kakao.com',
    }
    const apiError = new Error('request failed')
    vi.mocked(apiClient.post).mockRejectedValue(apiError)

    await expect(createInquiry(request)).rejects.toBe(apiError)
  })
})
