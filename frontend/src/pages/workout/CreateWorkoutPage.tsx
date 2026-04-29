import { PageHeader } from '@/components/layout/PageHeader'
import { WorkoutForm } from './components/WorkoutForm'
import { useCreateWorkout } from '@/hooks/workout/useCreateWorkout'

export default function CreateWorkoutPage() {
  const { mutate, isPending } = useCreateWorkout()

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader title="TẠO BUỔI TẬP" description="Lên kế hoạch cho buổi luyện tập mới" />
      <WorkoutForm
        onSubmit={(values) => mutate(values)}
        isLoading={isPending}
        submitLabel="Tạo buổi tập"
      />
    </div>
  )
}
