import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useDeleteExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => exerciseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISES() })
      toast.success('Đã xóa bài tập')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
