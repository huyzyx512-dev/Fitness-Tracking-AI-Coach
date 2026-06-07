import { useQuery } from '@tanstack/react-query'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useExercise(id: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.EXERCISE(id!),
    queryFn: async () => {
      const { exercise } = await exerciseApi.getById(id!)
      return exercise
    },
    enabled: typeof id === 'number' && Number.isFinite(id) && id > 0,
    staleTime: 60_000,
  })
}
