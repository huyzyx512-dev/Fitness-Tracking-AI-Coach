import { useQuery } from '@tanstack/react-query'
import { workoutLogApi } from '@/api/workoutLog.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useWorkoutLogList() {
  return useQuery({
    queryKey: QUERY_KEYS.WORKOUT_LOGS(),
    queryFn: async () => {
      const { workoutLogs } = await workoutLogApi.getAll()
      return workoutLogs
    },
    staleTime: 30_000,
  })
}
