import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Card }      from '@/components/ui/Card'
import { Badge }     from '@/components/ui/Badge'
import { useExerciseList } from '@/hooks/exercise/useExerciseList'
import { ROUTES, DIFFICULTY_LABELS, DIFFICULTY } from '@/lib/constants'
import type { Exercise, CreateExercisePayload } from '@/types/exercise.types'

/* Create Exercise:
   - Field có dấu * là bắt buộc
   - Field không có * có thể bỏ trống
   - Nếu có nhập URL thì phải hợp lệ */
const optionalInt = z
  .union([z.literal('').transform(() => undefined), z.coerce.number().int().positive()])
  .optional()

const optionalPositiveNumber = z
  .union([z.literal('').transform(() => undefined), z.coerce.number().positive('Giá trị MET phải lớn hơn 0')])
  .optional()

const optionalText = (msg: string) => z.string().trim().min(1, msg).optional().or(z.literal(''))

const schema = z.object({
  name:             z.string().trim().min(1, 'Vui lòng nhập tên bài tập').max(100),
  description:      optionalText('Vui lòng nhập mô tả bài tập'),
  category_id:      optionalInt,
  muscle_group_ids: z.array(z.number()).optional(),
  difficulty_level: z.enum(['cơ bản', 'trung bình', 'nâng cao'] as const),
  equipment:        optionalText('Vui lòng nhập dụng cụ'),
  met_value:        optionalPositiveNumber,
  video_url:        z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  thumbnail_url:    z.string().url('URL không hợp lệ').optional().or(z.literal('')),
})

type ExerciseFormInput = z.input<typeof schema>
export type ExerciseFormValues = z.output<typeof schema>

const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label }))

interface ExerciseFormProps {
  defaultValues?: Partial<ExerciseFormValues>
  onSubmit: (values: CreateExercisePayload, videoFile: File | null) => void | Promise<void>
  isLoading: boolean
  submitLabel?: string
}

export function ExerciseForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Lưu bài tập' }: ExerciseFormProps) {
  const navigate = useNavigate()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const { data: exercises } = useExerciseList()

  /* Derive unique categories & muscle groups from exercise list */
  const categories = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) => { if (e.category) map.set(e.category.id, e.category.name) })
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [exercises])

  const muscleGroups = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) =>
      e.muscleGroups?.forEach((mg) => map.set(mg.id, mg.name))
    )
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [exercises])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ExerciseFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty_level: DIFFICULTY.CO_BAN, muscle_group_ids: [], ...defaultValues },
  })

  const selectedMuscles = watch('muscle_group_ids') ?? []

  function toggleMuscle(id: number) {
    const curr = selectedMuscles
    setValue(
      'muscle_group_ids',
      curr.includes(id) ? curr.filter((m) => m !== id) : [...curr, id],
    )
  }

  function handleCancel() {
    if (isDirty && !confirm('Bỏ các thay đổi chưa lưu?')) return
    navigate(ROUTES.EXERCISES)
  }

  return (
    <Card>
      <form
        onSubmit={handleSubmit(async (v) => {
          const payload = schema.parse(v) as CreateExercisePayload
          await onSubmit(payload, videoFile)
        })}
        className="space-y-5"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Tên bài tập"
            placeholder="VD: Barbell Bench Press"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Select
            label="Mức độ"
            options={difficultyOptions}
            error={errors.difficulty_level?.message}
            required
            {...register('difficulty_level')}
          />
        </div>

        <Textarea
          label="Mô tả"
          placeholder="Hướng dẫn kỹ thuật, lưu ý..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Nhóm bài tập"
            options={categories}
            placeholder="Chọn nhóm"
            error={errors.category_id?.message}
            {...register('category_id')}
          />
          <Input
            label="Thiết bị"
            placeholder="Barbell, Dumbbell, Cable..."
            error={errors.equipment?.message}
            {...register('equipment')}
          />
        </div>

        <Input
          label="Chỉ số MET"
          type="number"
          step="0.1"
          placeholder="3.0"
          helperText="Metabolic Equivalent — dùng để tính calo"
          error={errors.met_value?.message}
          {...register('met_value')}
        />

        <div className="space-y-3 rounded-xl border border-border/60 bg-surface/40 p-4">
          <p className="text-sm font-medium text-foreground/90">Video</p>
          <p className="text-xs text-muted leading-relaxed">
            Có thể dán link ngoài (YouTube, v.v.) hoặc chọn file video (MP4, WebM…) để tải lên sau khi lưu bài tập. File
            sẽ được gửi lên máy chủ khi bạn bấm &quot;{submitLabel}&quot;.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Video URL"
              type="url"
              placeholder="https://youtube.com/..."
              error={errors.video_url?.message}
              {...register('video_url')}
            />
            <Input
              label="Thumbnail URL"
              type="url"
              placeholder="https://..."
              error={errors.thumbnail_url?.message}
              {...register('thumbnail_url')}
            />
          </div>
          <Input
            label="File video (tuỳ chọn)"
            type="file"
            accept="video/*"
            className="min-h-11 py-0.5 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/30"
            helperText={
              videoFile
                ? `Đã chọn: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)} MB)`
                : undefined
            }
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Muscle group multi-select */}
        <div>
          <p className="text-sm font-medium text-foreground/80 mb-2">Nhóm cơ</p>
          {muscleGroups.length === 0 ? (
            <p className="text-xs text-muted italic">
              Chưa có dữ liệu nhóm cơ — hãy thêm bài tập khác trước để hệ thống nhận diện.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((mg) => (
                <button
                  key={mg.id}
                  type="button"
                  onClick={() => toggleMuscle(mg.id)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
                >
                  <Badge
                    variant={selectedMuscles.includes(mg.id) ? 'accent' : 'neutral'}
                    className="cursor-pointer transition-all hover:opacity-80"
                  >
                    {mg.name}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>Hủy</Button>
          <Button type="submit" loading={isLoading} className="flex-1">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  )
}

export function exerciseToFormValues(exercise: Exercise): ExerciseFormValues {
  return {
    name:             exercise.name,
    description:      exercise.description ?? '',
    category_id:      exercise.category_id ?? (undefined as unknown as number),
    difficulty_level: exercise.difficulty_level,
    equipment:        exercise.equipment ?? '',
    met_value:        exercise.met_value,
    video_url:        exercise.video_url ?? '',
    thumbnail_url:    exercise.thumbnail_url ?? '',
    muscle_group_ids: exercise.muscleGroups?.map((mg) => mg.id) ?? [],
  }
}
