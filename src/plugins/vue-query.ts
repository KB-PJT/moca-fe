import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 1분 동안 캐시 데이터를 최신 상태로 처리
      staleTime: 60 * 1000,

      // 사용하지 않는 캐시는 5분 뒤 삭제
      gcTime: 5 * 60 * 1000,

      // 조회 실패 시 1회 재시도
      retry: 1,

      // 브라우저로 다시 돌아왔을 때 자동 재조회하지 않음
      refetchOnWindowFocus: false,

      // 네트워크 재연결 시 재조회
      refetchOnReconnect: true,
    },

    mutations: {
      // 등록·수정·삭제 요청은 자동 재시도하지 않음
      retry: 0,
    },
  },
})
