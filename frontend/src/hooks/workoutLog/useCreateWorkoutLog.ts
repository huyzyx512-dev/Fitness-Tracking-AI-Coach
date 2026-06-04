import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workoutLogApi } from '@/api/workoutLog.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateWorkoutLogPayload } from '@/types/workout-log.types'

export function useCreateWorkoutLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWorkoutLogPayload) =>
      workoutLogApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUT_LOGS() })
      toast.success('Đã lưu nhật ký buổi tập')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
