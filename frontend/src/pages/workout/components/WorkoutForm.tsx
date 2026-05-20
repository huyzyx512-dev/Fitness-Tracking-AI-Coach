import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Type } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/lib/constants'
import type { CreateWorkoutPayload, Workout } from '@/types/workout.types'

/* Schema mirrors backend createWorkoutSchema — scheduled_at là tuỳ chọn */
const schema = z.object({
  title:        z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(100),
  notes:        z.string().trim().min(1, 'Vui lòng nhập ghi chú'),
  scheduled_at: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      { message: 'Định dạng ngày tháng không hợp lệ' },
    ),
})

export type WorkoutFormValues = z.infer<typeof schema>

interface WorkoutFormProps {
  defaultValues?: Partial<WorkoutFormValues>
  onSubmit:       (values: CreateWorkoutPayload) => void
  isLoading:      boolean
  submitLabel?:   string
}

export function WorkoutForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Lưu buổi tập',
}: WorkoutFormProps) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WorkoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  function handleCancel() {
    if (isDirty && !confirm('Bỏ các thay đổi chưa lưu?')) return
    navigate(ROUTES.WORKOUTS)
  }

  /** Transform form values → API payload: '' → null để backend nhận */
  function handleFormSubmit(values: WorkoutFormValues) {
    onSubmit({
      title: values.title,
      notes: values.notes,
      scheduled_at: values.scheduled_at ? values.scheduled_at : null,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Input
          label="Tên buổi tập"
          placeholder="VD: Push Day — Ngực & Vai"
          leftIcon={<Type size={15} />}
          error={errors.title?.message}
          required
          {...register('title')}
        />

        <Textarea
          label="Ghi chú"
          placeholder="Mục tiêu, lưu ý, cảm nhận..."
          error={errors.notes?.message}
          required
          {...register('notes')}
        />

        <Input
          label="Thời gian tập dự kiến (không bắt buộc)"
          type="datetime-local"
          leftIcon={<CalendarDays size={15} />}
          error={errors.scheduled_at?.message}
          {...register('scheduled_at')}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* Helper to transform Workout → WorkoutFormValues for edit pre-fill */
export function workoutToFormValues(workout: Workout): WorkoutFormValues {
  return {
    title:        workout.title,
    notes:        workout.notes ?? '',
    scheduled_at: workout.scheduled_at
      ? new Date(workout.scheduled_at).toISOString().slice(0, 16)
      : '',
  }
}
