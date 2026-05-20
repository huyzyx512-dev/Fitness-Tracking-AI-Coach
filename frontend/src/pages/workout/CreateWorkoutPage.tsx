import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Activity, CalendarDays, Type } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

import { workoutApi } from '@/api/workout.api'
import { useExerciseList } from '@/hooks/exercise/useExerciseList'
import { QUERY_KEYS, ROUTES, DIFFICULTY_LABELS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateWorkoutPayload } from '@/types/workout.types'
import type { Exercise } from '@/types/exercise.types'

import { ExercisePickerCard } from './components/ExercisePickerCard'
import { ExerciseConfigModal } from './components/ExerciseConfigModal'
import type { ExerciseConfigFormValues } from './components/exerciseConfigModal.schema'
import { PickedExerciseList, type PickedExerciseItem } from './components/PickedExerciseList'

/** Same rules as `WorkoutForm` — mirrors backend createWorkoutSchema. scheduled_at là tuỳ chọn. */
const workoutInfoSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(100),
  notes: z.string().trim().min(1, 'Vui lòng nhập ghi chú'),
  scheduled_at: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      { message: 'Định dạng ngày tháng không hợp lệ' },
    ),
})

type WorkoutInfoValues = z.infer<typeof workoutInfoSchema>

type ExerciseConfigState =
  | { mode: 'add'; exercise: Exercise }
  | { mode: 'edit'; exercise: Exercise; index: number }
  | null

export default function CreateWorkoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [singleMuscleId, setSingleMuscleId] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [picked, setPicked] = useState<PickedExerciseItem[]>([])
  const [configEx, setConfigEx] = useState<ExerciseConfigState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedMuscleIds = useMemo(
    () => (singleMuscleId ? [Number(singleMuscleId)] : []),
    [singleMuscleId],
  )

  const { data: exercises, isLoading, error, refetch } = useExerciseList({
    muscle_group_ids: selectedMuscleIds,
    muscle_match: 'any',
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WorkoutInfoValues>({
    resolver: zodResolver(workoutInfoSchema),
  })

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) => {
      if (e.category) map.set(e.category.id, e.category.name)
    })
    return [
      { value: '', label: 'Tất cả nhóm' },
      ...[...map.entries()].map(([v, l]) => ({ value: String(v), label: l })),
    ]
  }, [exercises])

  const muscleOptions = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) => {
      e.muscleGroups.forEach((muscle) => {
        map.set(muscle.id, muscle.name)
      })
    })

    const items = [...map.entries()]
      .map(([value, label]) => ({ value: String(value), label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))

    return [{ value: '', label: 'Tất cả nhóm cơ' }, ...items]
  }, [exercises])

  const diffOptions = [
    { value: '', label: 'Tất cả mức độ' },
    ...Object.entries(DIFFICULTY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ]

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()))
      .filter((e) => !catFilter || String(e.category_id) === catFilter)
      .filter((e) => !diffFilter || e.difficulty_level === diffFilter)
  }, [exercises, search, catFilter, diffFilter])

  const pickedIds = useMemo(() => new Set(picked.map((p) => p.exercise.id)), [picked])

  function handleCancel() {
    const hasPicked = picked.length > 0
    if ((isDirty || hasPicked) && !confirm('Bỏ các thay đổi chưa lưu?')) return
    navigate(ROUTES.WORKOUTS)
  }

  function handlePickExercise(exercise: Exercise) {
    setConfigEx({ mode: 'add', exercise })
  }

  function handleConfigSubmit(values: ExerciseConfigFormValues) {
    if (!configEx) return
    if (configEx.mode === 'add') {
      setPicked((prev) => [
        ...prev,
        {
          exercise: configEx.exercise,
          sets: values.sets,
          reps: values.reps,
          weight: values.weight,
          rest_time_seconds: values.rest_time_seconds,
          comment: values.comment ?? '',
        },
      ])
    } else {
      const { index } = configEx
      setPicked((prev) => {
        const next = [...prev]
        const row = next[index]
        if (!row) return prev
        next[index] = {
          exercise: row.exercise,
          sets: values.sets,
          reps: values.reps,
          weight: values.weight,
          rest_time_seconds: values.rest_time_seconds,
          comment: values.comment ?? '',
        }
        return next
      })
    }
    setConfigEx(null)
  }

  async function onCreateWorkout(values: WorkoutInfoValues) {
    const payload: CreateWorkoutPayload = {
      title: values.title,
      notes: values.notes,
      scheduled_at: values.scheduled_at ? values.scheduled_at : null,
    }
    setIsSubmitting(true)
    try {
      const { workout } = await workoutApi.create(payload)

      if (picked.length > 0) {
        const results = await Promise.allSettled(
          picked.map((p, i) =>
            workoutApi.addExercise(workout.id, p.exercise.id, {
              sets: p.sets,
              reps: p.reps,
              weight: p.weight,
              rest_time_seconds: p.rest_time_seconds,
              comment: p.comment.trim() || undefined,
              order_index: i,
            }),
          ),
        )
        const failed = results.filter((r) => r.status === 'rejected').length

        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
        toast.success('Tạo buổi tập thành công!')
        if (failed > 0) {
          toast(
            `Tạo buổi tập thành công nhưng ${failed} bài tập chưa thêm được, vui lòng thử lại.`,
            { icon: '⚠️', duration: 6000 },
          )
        }
        navigate(ROUTES.WORKOUT_DETAIL(workout.id))
        return
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Tạo buổi tập thành công!')
      navigate(ROUTES.WORKOUT_DETAIL(workout.id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalExercise = configEx?.exercise ?? null
  const editDefaults = useMemo(() => {
    if (configEx?.mode !== 'edit') return undefined
    const row = picked[configEx.index]
    if (!row) return undefined
    return {
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      rest_time_seconds: row.rest_time_seconds,
      comment: row.comment ?? '',
    }
  }, [configEx, picked])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="TẠO BUỔI TẬP"
        description="Lên kế hoạch và chọn bài tập trong một màn hình"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-5 lg:col-span-5">
          <Card>
            <form id="create-workout-form" onSubmit={handleSubmit(onCreateWorkout)} className="space-y-5">
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

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type="submit" loading={isSubmitting} className="w-full sm:flex-1 min-h-11">
                  Tạo buổi tập
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài tập đã chọn ({picked.length})</CardTitle>
            </CardHeader>
            <PickedExerciseList
              items={picked}
              onEdit={(idx) => {
                const row = picked[idx]
                if (!row) return
                setConfigEx({ mode: 'edit', exercise: row.exercise, index: idx })
              }}
              onRemove={(idx) => {
                setPicked((prev) => prev.filter((_, i) => i !== idx))
              }}
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm bài tập..."
              className="flex-1"
            />
            <Select
              options={categories}
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="sm:w-44"
            />
            <Select
              options={muscleOptions}
              value={singleMuscleId}
              onChange={(e) => setSingleMuscleId(e.target.value)}
              className="sm:w-44"
            />
            <Select
              options={diffOptions}
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="sm:w-40"
            />
          </div>

          {isLoading ? (
            <div className="grid max-h-[min(70vh,720px)] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Activity size={24} />}
              title="Không tìm thấy bài tập"
              description="Thử thay đổi bộ lọc hoặc tạo bài tập mới trong thư viện."
            />
          ) : (
            <div className="grid max-h-[min(70vh,720px)] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
              {filtered.map((ex) => (
                <ExercisePickerCard
                  key={ex.id}
                  exercise={ex}
                  disabled={pickedIds.has(ex.id)}
                  onPick={handlePickExercise}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ExerciseConfigModal
        open={configEx !== null}
        onClose={() => setConfigEx(null)}
        exercise={modalExercise}
        mode={configEx?.mode ?? 'add'}
        defaultValues={editDefaults}
        onSubmit={handleConfigSubmit}
      />
    </div>
  )
}
