import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader }    from '@/components/layout/PageHeader'
import { ExerciseForm, exerciseToFormValues } from './components/ExerciseForm'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState }    from '@/components/ui/ErrorState'
import { useExerciseList }   from '@/hooks/exercise/useExerciseList'
import { useUpdateExercise } from '@/hooks/exercise/useUpdateExercise'
import { useExerciseOptionalVideoUpload } from '@/hooks/exercise/useExerciseOptionalVideoUpload'
import { ROUTES } from '@/lib/constants'
import type { CreateExercisePayload } from '@/types/exercise.types'

export default function EditExercisePage() {
  const { id }       = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exerciseId   = Number(id)
  const { data, isLoading, error, refetch } = useExerciseList()
  const exercise     = useMemo(() => data?.find((e) => e.id === exerciseId), [data, exerciseId])
  const { mutateAsync, isPending } = useUpdateExercise(exerciseId, { skipNavigate: true })
  const { tryUploadVideoAfterSave, isUploadingVideo } = useExerciseOptionalVideoUpload()

  async function handleSubmit(values: CreateExercisePayload, videoFile: File | null) {
    try {
      await mutateAsync(values)
      await tryUploadVideoAfterSave(
        exerciseId,
        videoFile,
        'Đã lưu bài tập nhưng upload video thất bại',
      )
      navigate(ROUTES.EXERCISES)
    } catch {
      /* update lỗi — toast trong useUpdateExercise */
    }
  }

  if (isLoading) return <FullPageSpinner />
  if (error)     return <ErrorState error={error} onRetry={refetch} />
  if (!exercise) return <ErrorState message="Không tìm thấy bài tập" />

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader title="CHỈNH SỬA BÀI TẬP" description={exercise.name} />
      <ExerciseForm
        defaultValues={exerciseToFormValues(exercise)}
        onSubmit={handleSubmit}
        isLoading={isPending || isUploadingVideo}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
