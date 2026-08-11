import apiClient from '@/shared/api/client'

export type InquiryType =
  | 'card_link'
  | 'performance_benefit'
  | 'map_merchant'
  | 'account_login'
  | 'bug'
  | 'etc'

export interface CreateInquiryRequest {
  inquiryType: InquiryType
  title: string
  content: string
  replyEmail: string
}

export interface InquiryResponse {
  inquiryId: string
  inquiryType: InquiryType
  title: string
  content: string
  replyEmail: string
  status: 'received'
  createdAt: string
}

export interface InquiryErrorApiResponse {
  success: false
  data: unknown
  error: {
    code: 'VALIDATION_FAILED' | 'AUTHENTICATION_REQUIRED' | string
    message: string
    fields?: Record<string, string>
  }
}

interface CreateInquiryApiResponse {
  success: true
  data: InquiryResponse
}

export async function createInquiry(request: CreateInquiryRequest): Promise<InquiryResponse> {
  const response = await apiClient.post<CreateInquiryApiResponse>(
    '/api/v1/support/inquiries',
    request,
  )

  return response.data.data
}
