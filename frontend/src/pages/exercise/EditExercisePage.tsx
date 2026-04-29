import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader }    from '@/components/layout/PageHeader'
import { ExerciseForm, exerciseToFormValues } from './components/ExerciseForm'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState }    from '@/components/ui/ErrorState'
import { useExerciseList }   from '@/hooks/exercise/useExerciseList'
import { useUpdateExercise } from '@/hooks/exercise/useUpdateExercise'

export default function EditExercisePage() {
  const { id }       = useParams<{ id: string }>()
  const exerciseId   = Number(id)
  const { data, isLoading, error, refetch } = useExerciseList()
  const exercise     = useMemo(() => data?.find((e) => e.id === exerciseId), [data, exerciseId])
  const { mutate, isPending } = useUpdateExercise(exerciseId)

  if (isLoading) return <FullPageSpinner />
  if (error)     return <ErrorState error={error} onRetry={refetch} />
  if (!exercise) return <ErrorState message="Không tìm thấy bài tập" />

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader title="CHỈNH SỬA BÀI TẬP" description={exercise.name} />
      <ExerciseForm
        defaultValues={exerciseToFormValues(exercise)}
        onSubmit={(v) => mutate(v)}
        isLoading={isPending}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
