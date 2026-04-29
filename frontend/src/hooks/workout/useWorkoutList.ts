import { useQuery } from '@tanstack/react-query'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useWorkoutList() {
  return useQuery({
    queryKey: QUERY_KEYS.WORKOUTS(),
    queryFn: async () => {
      const { workouts } = await workoutApi.getAll()
      return workouts
    },
    staleTime: 30_000,
  })
}
