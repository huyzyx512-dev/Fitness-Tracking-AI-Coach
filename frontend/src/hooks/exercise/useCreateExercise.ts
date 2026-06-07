import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateExercisePayload } from '@/types/exercise.types'

type UseCreateExerciseOptions = { skipNavigate?: boolean }

export function useCreateExercise(options?: UseCreateExerciseOptions) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const skipNavigate = options?.skipNavigate ?? false

  return useMutation({
    mutationFn: (payload: CreateExercisePayload) => exerciseApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISES() })
      toast.success('Tạo bài tập thành công!')
      if (!skipNavigate) navigate(ROUTES.EXERCISES)
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
