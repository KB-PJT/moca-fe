import axios from 'axios'
import apiClient from '@/shared/api/client'
import type { HomeCardsResponse } from '@/domains/home/api/homeCards'

interface HomeCardsApiResponse {
  success: boolean
  data: HomeCardsResponse
}

let prefetchedHomeCards: Promise<HomeCardsResponse | null> | undefined

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
  if (!prefetchedHomeCards) {
    prefetchedHomeCards = requestHomeCards()
    void prefetchedHomeCards.catch(() => undefined)
  }

  return prefetchedHomeCards
}

export function clearHomeCardsPrefetch() {
  prefetchedHomeCards = undefined
}

export function consumePrefetchedHomeCards(): Promise<HomeCardsResponse | null> {
  const prefetchedRequest = prefetchedHomeCards
  prefetchedHomeCards = undefined

  return prefetchedRequest ?? requestHomeCards()
}
