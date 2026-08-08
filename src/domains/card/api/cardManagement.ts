import apiClient from '@/shared/api/client'

export interface MyCardItemResponse {
  userCardId: string
  cardName: string
  cardNo: string | null
  issuerId: string
  issuerName: string
  cardImageUrl: string | null
  memo: string | null
}

export interface MyCardsResponse {
  lastSyncedAt: string | null
  activeCards: MyCardItemResponse[]
  inactiveCards?: MyCardItemResponse[]
}

interface MyCardsApiResponse {
  success: boolean
  data: MyCardsResponse
}

export async function fetchMyCards(): Promise<MyCardsResponse> {
  const response = await apiClient.get<MyCardsApiResponse>('/api/v1/me/cards', {
    params: { includeInactive: false },
  })

  return response.data.data
}
