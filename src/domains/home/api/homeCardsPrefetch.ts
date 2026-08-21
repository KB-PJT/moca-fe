import axios from 'axios'
import { useAuthStore } from '@/domains/auth/stores/auth'
import apiClient from '@/shared/api/client'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'

interface HomeCardsApiResponse {
  success: boolean
  data: HomeCardsResponse
}

interface PrefetchedHomeCards {
  accessToken: string | null
  request: Promise<HomeCardsResponse | null>
}

let prefetchedHomeCards: PrefetchedHomeCards | undefined

async function requestHomeCards(): Promise<HomeCardsResponse | null> {
  try {
    const response = await apiClient.get<HomeCardsApiResponse>('/api/v1/home/cards')
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export function prefetchHomeCards(): Promise<HomeCardsResponse | null> {
  const accessToken = useAuthStore().accessToken

  if (!prefetchedHomeCards || prefetchedHomeCards.accessToken !== accessToken) {
    const request = requestHomeCards()
    prefetchedHomeCards = { accessToken, request }
    void request.catch(() => undefined)
  }

  return prefetchedHomeCards.request
}

export function clearHomeCardsPrefetch() {
  prefetchedHomeCards = undefined
}

export function consumePrefetchedHomeCards(): Promise<HomeCardsResponse | null> {
  const accessToken = useAuthStore().accessToken
  const prefetchedRequest =
    prefetchedHomeCards?.accessToken === accessToken ? prefetchedHomeCards.request : undefined
  prefetchedHomeCards = undefined

  return prefetchedRequest ?? requestHomeCards()
}
