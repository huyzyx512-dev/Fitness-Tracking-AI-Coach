import { useCallback, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export async function invalidateExerciseListAndDetail(
  queryClient: QueryClient,
  exerciseId: number,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISES() })
  await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISE(exerciseId) })
}

/**
 * Sau khi create/update JSON thành công: upload video (nếu có), invalidate cache.
 * Lỗi upload chỉ toast — không throw (bài tập đã được lưu).
 */
export function useExerciseOptionalVideoUpload() {
  const queryClient = useQueryClient()
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const tryUploadVideoAfterSave = useCallback(
    async (exerciseId: number, videoFile: File | null, partialFailurePrefix: string) => {
      if (!videoFile) return
      setIsUploadingVideo(true)
      try {
        await exerciseApi.uploadVideo(exerciseId, videoFile)
        await invalidateExerciseListAndDetail(queryClient, exerciseId)
      } catch (uploadErr) {
        toast.error(`${partialFailurePrefix}: ${getErrorMessage(uploadErr)}`)
      } finally {
        setIsUploadingVideo(false)
      }
    },
    [queryClient],
  )

  return { tryUploadVideoAfterSave, isUploadingVideo }
}
