import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExerciseForm } from './components/ExerciseForm'
import { useCreateExercise } from '@/hooks/exercise/useCreateExercise'
import { useExerciseOptionalVideoUpload } from '@/hooks/exercise/useExerciseOptionalVideoUpload'
import { ROUTES } from '@/lib/constants'
import type { CreateExercisePayload } from '@/types/exercise.types'

export default function CreateExercisePage() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useCreateExercise({ skipNavigate: true })
  const { tryUploadVideoAfterSave, isUploadingVideo } = useExerciseOptionalVideoUpload()

  async function handleSubmit(values: CreateExercisePayload, videoFile: File | null) {
    try {
      const res = await mutateAsync(values)
      await tryUploadVideoAfterSave(
        res.exercise.id,
        videoFile,
        'Đã tạo bài tập nhưng upload video thất bại',
      )
      navigate(ROUTES.EXERCISES)
    } catch {
      /* create lỗi — toast trong useCreateExercise */
    }
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <PageHeader title="TẠO BÀI TẬP" description="Thêm bài tập mới vào thư viện" />
      <ExerciseForm
        onSubmit={handleSubmit}
        isLoading={isPending || isUploadingVideo}
        submitLabel="Tạo bài tập"
      />
    </div>
  )
}
