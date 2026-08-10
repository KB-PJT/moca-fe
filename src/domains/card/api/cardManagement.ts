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

interface SuccessApiResponse {
  success: boolean
  data: {
    success: boolean
  }
}

export async function fetchMyCards(): Promise<MyCardsResponse> {
  const response = await apiClient.get<MyCardsApiResponse>('/api/v1/me/cards', {
    params: { includeInactive: false },
  })

  return response.data.data
}

export async function deactivateMyCard(userCardId: string): Promise<void> {
  await apiClient.patch<SuccessApiResponse>(
    `/api/v1/me/cards/${encodeURIComponent(userCardId)}/deactivate`,
  )
}

export async function disconnectMyCard(userCardId: string): Promise<void> {
  await apiClient.delete<SuccessApiResponse>(`/api/v1/me/cards/${encodeURIComponent(userCardId)}`)
}
