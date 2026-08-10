import type { MyCardItemResponse } from '@/domains/card/api/cardManagement'
import apiClient from '@/shared/api/client'

export interface CardDetailBenefitResponse {
  benefitId: string
  title: string
  summary: string | null
  detailText: string | null
  detailHtml: string | null
}

export interface CardDetailResponse {
  userCardId: string
  cardName: string
  cardNo: string | null
  issuerId: string
  issuerName: string
  cardImageUrl: string | null
  memo: string | null
  benefits: CardDetailBenefitResponse[]
  notices: CardDetailBenefitResponse[]
}

interface CardDetailApiResponse {
  success: boolean
  data: CardDetailResponse
}

interface MyCardItemApiResponse {
  success: boolean
  data: MyCardItemResponse
}

export async function fetchCardDetail(userCardId: string): Promise<CardDetailResponse> {
  const response = await apiClient.get<CardDetailApiResponse>(
    `/api/v1/me/cards/${encodeURIComponent(userCardId)}`,
  )

  return response.data.data
}

export async function updateCardMemo(
  userCardId: string,
  memo: string | null,
): Promise<MyCardItemResponse> {
  const response = await apiClient.patch<MyCardItemApiResponse>(
    `/api/v1/me/cards/${encodeURIComponent(userCardId)}/memo`,
    { memo },
  )

  return response.data.data
}
