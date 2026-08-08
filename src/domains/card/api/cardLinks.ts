import apiClient from '@/shared/api/client'

export interface CreateCardLinkRequest {
  institutionCode: string
  id?: string
  password?: string
  cardNo?: string
  cardPassword?: string
  birthDate?: string
}

export interface CardOptionChoiceResponse {
  optionChoiceId: string
  choiceKey: string
  choiceName: string
}

export interface CardOptionGroupResponse {
  optionGroupId: string
  groupKey: string
  groupName: string
  choices: CardOptionChoiceResponse[]
}

export interface CardLinkCardResponse {
  userCardId: string | null
  cardId: string | null
  cardName: string
  cardNo: string | null
  institutionCode: string
  issuerName: string
  cardType: 'CREDIT' | 'CHECK' | 'UNKNOWN'
  cardImageUrl: string | null
  matched: boolean
  supported: boolean
  optionGroups: CardOptionGroupResponse[]
}

export interface CardLinkResponse {
  linkId: string
  institutionCode: string
  status: 'PENDING_CARD_ACTIVATION'
  cards: CardLinkCardResponse[]
}

interface CardLinkApiResponse {
  success: boolean
  data: CardLinkResponse
}

export interface SyncOwnedCardsResult {
  linkId: string
  institutionCode: string
  success: boolean
  cards: CardLinkCardResponse[]
}

export interface SyncOwnedCardsResponse {
  results: SyncOwnedCardsResult[]
}

interface SyncOwnedCardsApiResponse {
  success: boolean
  data: SyncOwnedCardsResponse
}

export interface CardOptionSelectionRequest {
  optionGroupId: string
  optionChoiceId: string
}

export interface UserCardOptionSelectionsRequest {
  userCardId: string
  optionSelections: CardOptionSelectionRequest[]
}

export interface ActivateCardLinkCardsRequest {
  activeUserCardIds: string[]
  optionSelections?: UserCardOptionSelectionsRequest[]
}

export interface ActivateCardLinkCardsResponse {
  linkId: string
  activatedUserCardIds: string[]
  activatedCount: number
}

interface ActivateCardLinkCardsApiResponse {
  success: boolean
  data: ActivateCardLinkCardsResponse
}

export interface SubmitCardCredentialsRequest {
  cardNo: string
  cardPassword?: string
}

interface SubmitCardCredentialsApiResponse {
  success: boolean
  data: CardLinkCardResponse
}

export interface CardLinkErrorResponse {
  success: false
  data: null
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

export async function createCardLink(request: CreateCardLinkRequest): Promise<CardLinkResponse> {
  const response = await apiClient.post<CardLinkApiResponse>('/api/v1/card-links', request)
  return response.data.data
}

export async function syncCardLinkCards(institutionCode: string): Promise<SyncOwnedCardsResponse> {
  const response = await apiClient.post<SyncOwnedCardsApiResponse>(
    '/api/v1/card-links/cards/sync',
    undefined,
    { params: { institutionCode } },
  )
  return response.data.data
}

export async function activateCardLinkCards(
  linkId: string,
  request: ActivateCardLinkCardsRequest,
): Promise<ActivateCardLinkCardsResponse> {
  const response = await apiClient.patch<ActivateCardLinkCardsApiResponse>(
    `/api/v1/card-links/${encodeURIComponent(linkId)}/cards`,
    request,
  )
  return response.data.data
}

export async function submitCardCredentials(
  userCardId: string,
  request: SubmitCardCredentialsRequest,
): Promise<CardLinkCardResponse> {
  const response = await apiClient.patch<SubmitCardCredentialsApiResponse>(
    `/api/v1/card-links/cards/${encodeURIComponent(userCardId)}/credentials`,
    request,
  )
  return response.data.data
}
