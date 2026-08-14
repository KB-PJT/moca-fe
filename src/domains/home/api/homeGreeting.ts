import apiClient from '@/shared/api/client'

export interface HomeGreetingResponse {
  nickname: string
  yearMonth: string
  missedBenefitAmount: number
  message: string
}

interface HomeGreetingApiResponse {
  success: boolean
  data: HomeGreetingResponse
}

export async function fetchHomeGreeting(): Promise<HomeGreetingResponse> {
  const response = await apiClient.get<HomeGreetingApiResponse>('/api/v1/home/greeting')
  return response.data.data
}
