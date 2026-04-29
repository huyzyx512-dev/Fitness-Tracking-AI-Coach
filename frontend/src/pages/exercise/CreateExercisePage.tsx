import { PageHeader } from '@/components/layout/PageHeader'
import { ExerciseForm } from './components/ExerciseForm'
import { useCreateExercise } from '@/hooks/exercise/useCreateExercise'

export default function CreateExercisePage() {
  const { mutate, isPending } = useCreateExercise()
  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader title="TẠO BÀI TẬP" description="Thêm bài tập mới vào thư viện" />
      <ExerciseForm onSubmit={(v) => mutate(v)} isLoading={isPending} submitLabel="Tạo bài tập" />
    </div>
  )
}
