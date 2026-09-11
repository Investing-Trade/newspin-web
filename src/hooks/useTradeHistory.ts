import { useQuery } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import type { PageParams } from '../api/types'

export function useTradeHistory(sessionId: number, params: PageParams) {
  return useQuery({
    queryKey: ['trades', sessionId, params],
    queryFn: () => simulationApi.getTradeHistory(sessionId, params),
    placeholderData: (previousData) => previousData,
  })
}
