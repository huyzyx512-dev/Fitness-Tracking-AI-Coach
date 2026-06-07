import { useQuery } from '@tanstack/react-query'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS } from '@/lib/constants'
import type { ExerciseListFilters } from '@/types/exercise.types'

export function useExerciseList(filters: ExerciseListFilters = {}) {
  const normalizedFilters = {
    muscle_group_ids: filters.muscle_group_ids?.length ? [...filters.muscle_group_ids].sort((a, b) => a - b) : [],
    muscle_match: filters.muscle_match === 'all' ? 'all' : 'any',
  } as const

  return useQuery({
    queryKey: [...QUERY_KEYS.EXERCISES(), normalizedFilters],
    queryFn: async () => {
      const { exercises } = await exerciseApi.getAll(normalizedFilters)
      return exercises
    },
    staleTime: 60_000,
  })
}
