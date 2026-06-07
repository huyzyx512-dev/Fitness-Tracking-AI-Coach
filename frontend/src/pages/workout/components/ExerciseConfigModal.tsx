import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { Exercise } from '@/types/exercise.types'
import {
  exerciseConfigSchema,
  EXERCISE_CONFIG_ADD_DEFAULTS,
  type ExerciseConfigFormInput,
  type ExerciseConfigFormValues,
} from './exerciseConfigModal.schema'

interface ExerciseConfigModalProps {
  open: boolean
  onClose: () => void
  exercise: Exercise | null
  mode: 'add' | 'edit'
  /** When `mode === 'edit'`, initial field values (merged over add defaults). */
  defaultValues?: Partial<ExerciseConfigFormValues>
  onSubmit: (values: ExerciseConfigFormValues) => void | Promise<void>
  isLoading?: boolean
}

export function ExerciseConfigModal({
  open,
  onClose,
  exercise,
  mode,
  defaultValues,
  onSubmit,
  isLoading = false,
}: ExerciseConfigModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExerciseConfigFormInput, unknown,ExerciseConfigFormValues>({
    resolver: zodResolver(exerciseConfigSchema),
    defaultValues: EXERCISE_CONFIG_ADD_DEFAULTS,
  })

  useEffect(() => {
    if (!open || !exercise) return
    const merged =
      mode === 'edit' && defaultValues
        ? { ...EXERCISE_CONFIG_ADD_DEFAULTS, ...defaultValues }
        : EXERCISE_CONFIG_ADD_DEFAULTS
    reset(merged)
  }, [open, exercise, mode, defaultValues, reset])

  if (!exercise) return null

  const title =
    mode === 'add' ? `Thêm bài: ${exercise.name}` : `Chỉnh sửa: ${exercise.name}`

  const submitLabel =
    mode === 'add' ? 'Thêm vào buổi tập' : 'Lưu thay đổi'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="exercise-config-form"
            size="sm"
            loading={isLoading}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id="exercise-config-form"
        className="space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sets"
            type="number"
            min={1}
            step={1}
            error={errors.sets?.message}
            {...register('sets')}
          />
          <Input
            label="Reps"
            type="number"
            min={1}
            step={1}
            error={errors.reps?.message}
            {...register('reps')}
          />
          <Input
            label="Cân nặng (kg)"
            type="number"
            min={0}
            step="0.5"
            error={errors.weight?.message}
            {...register('weight')}
          />
          <Input
            label="Nghỉ (giây)"
            type="number"
            min={0}
            step={1}
            error={errors.rest_time_seconds?.message}
            {...register('rest_time_seconds')}
          />
        </div>
        <Textarea
          label="Ghi chú"
          placeholder="Ghi chú cho hiệp này (tuỳ chọn)"
          rows={3}
          error={errors.comment?.message}
          {...register('comment')}
        />
      </form>
    </Modal>
  )
}
