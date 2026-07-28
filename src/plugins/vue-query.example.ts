import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import http from '@/shared/api/client'

interface Card {
  cardId: number
  cardName: string
  isPrimary: boolean
}

/**
 * 카드 목록 조회 예시
 *
 * 사용:
 * const { data, isPending, isError } = useCardsQuery()
 */
export function useCardsQuery() {
  return useQuery({
    queryKey: ['cards', 'list'],

    queryFn: async () => {
      const response = await http.get<Card[]>('/cards')
      return response.data
    },
  })
}

/**
 * 대표 카드 변경 예시
 *
 * 사용:
 * const mutation = useSetPrimaryCardMutation()
 * mutation.mutate(cardId)
 */
export function useSetPrimaryCardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cardId: number) => {
      const response = await http.patch(`/cards/${cardId}/primary`)

      return response.data
    },

    // 수정 성공 후 카드 목록 다시 조회
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cards'],
      })
    },
  })
}
