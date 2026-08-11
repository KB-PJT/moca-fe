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

export type CardAccessState = 'none' | 'inactive-only' | 'active'

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

export function resolveCardAccessState(response: MyCardsResponse): CardAccessState {
  if (response.activeCards.length > 0) return 'active'
  if ((response.inactiveCards?.length ?? 0) > 0) return 'inactive-only'
  return 'none'
}

export async function reorderMyCards(userCardIds: string[]): Promise<MyCardsResponse> {
  const response = await apiClient.patch<MyCardsApiResponse>('/api/v1/me/cards/order', {
    userCardIds,
  })

  return response.data.data
}

export async function deactivateMyCard(userCardId: string): Promise<void> {
  const response = await apiClient.patch<SuccessApiResponse>(
    `/api/v1/me/cards/${encodeURIComponent(userCardId)}/deactivate`,
  )
  if (!response.data.data.success) throw new Error('CARD_DEACTIVATION_FAILED')
}

export async function disconnectMyCard(userCardId: string): Promise<void> {
  const response = await apiClient.delete<SuccessApiResponse>(
    `/api/v1/me/cards/${encodeURIComponent(userCardId)}`,
  )
  if (!response.data.data.success) throw new Error('CARD_DISCONNECTION_FAILED')
}
