import { useQuery } from '@tanstack/react-query'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useExerciseList() {
  return useQuery({
    queryKey: QUERY_KEYS.EXERCISES(),
    queryFn: async () => {
      const { exercises } = await exerciseApi.getAll()
      return exercises
    },
    staleTime: 60_000,
  })
}
