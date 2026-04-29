import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader }    from '@/components/layout/PageHeader'
import { WorkoutForm, workoutToFormValues } from './components/WorkoutForm'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState }    from '@/components/ui/ErrorState'
import { useWorkoutList }   from '@/hooks/workout/useWorkoutList'
import { useUpdateWorkout } from '@/hooks/workout/useUpdateWorkout'

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const workoutId = Number(id)

  const { data: workouts, isLoading, error, refetch } = useWorkoutList()
  const workout = useMemo(
    () => workouts?.find((w) => w.id === workoutId),
    [workouts, workoutId],
  )

  const { mutate, isPending } = useUpdateWorkout(workoutId)

  if (isLoading) return <FullPageSpinner />
  if (error)     return <ErrorState error={error} onRetry={refetch} />
  if (!workout)  return <ErrorState message="Không tìm thấy buổi tập" />

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader
        title="CHỈNH SỬA BUỔI TẬP"
        description={workout.title}
      />
      <WorkoutForm
        defaultValues={workoutToFormValues(workout)}
        onSubmit={(values) => mutate(values)}
        isLoading={isPending}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
