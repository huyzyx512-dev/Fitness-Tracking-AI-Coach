import { useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

import { useGenerateWorkoutPlan } from '@/hooks/ai/useGenerateWorkoutPlan'
import { getErrorMessage } from '@/lib/utils'
import type {
  AiFitnessLevel,
  AiGeneratedDay,
  AiGeneratedExercise,
  AiGoal,
  AiWorkoutPlanRequest,
} from '@/types/ai.types'
import type { Exercise } from '@/types/exercise.types'
import {
  EXERCISE_CONFIG_ADD_DEFAULTS,
  type ExerciseConfigFormValues,
} from './exerciseConfigModal.schema'
import type { PickedExerciseItem } from './PickedExerciseList'

const GOAL_OPTIONS: { value: AiGoal; label: string }[] = [
  { value: 'general_fitness', label: 'Sức khỏe tổng quát' },
  { value: 'muscle_gain', label: 'Tăng cơ' },
  { value: 'fat_loss', label: 'Giảm mỡ' },
  { value: 'endurance', label: 'Sức bền' },
  { value: 'other', label: 'Khác' },
]

const LEVEL_OPTIONS: { value: AiFitnessLevel; label: string }[] = [
  { value: 'beginner', label: 'Người mới' },
  { value: 'intermediate', label: 'Trung bình' },
  { value: 'advanced', label: 'Nâng cao' },
]

const MAX_NOTES_LENGTH = 2000
const UNMAPPED_TOAST =
  'Một số bài AI gợi ý chưa có trong thư viện nên chưa được thêm vào form. Hãy dùng AI Coach Apply nếu muốn backend tự tạo bài mới.'
const NO_MAPPED_ERROR =
  'Không có bài tập nào từ AI khớp với thư viện hiện tại.'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function aiExerciseToConfig(exercise: AiGeneratedExercise): ExerciseConfigFormValues {
  return {
    sets: exercise.sets > 0 ? exercise.sets : EXERCISE_CONFIG_ADD_DEFAULTS.sets,
    reps: exercise.reps > 0 ? exercise.reps : EXERCISE_CONFIG_ADD_DEFAULTS.reps,
    weight: exercise.weight ?? EXERCISE_CONFIG_ADD_DEFAULTS.weight,
    rest_time_seconds:
      exercise.restTimeSeconds ?? EXERCISE_CONFIG_ADD_DEFAULTS.rest_time_seconds,
    comment: exercise.notes?.trim() ?? '',
  }
}

type PreviewRow = {
  key: string
  aiExercise: AiGeneratedExercise
  exercise: Exercise | null
  config: ExerciseConfigFormValues
}

function buildPreviewRows(
  aiExercises: AiGeneratedExercise[],
  exerciseById: Map<number, Exercise>,
): PreviewRow[] {
  return aiExercises.map((aiExercise, index) => {
    const exercise =
      aiExercise.exerciseId != null
        ? exerciseById.get(aiExercise.exerciseId) ?? null
        : null
    return {
      key: `${index}-${aiExercise.exerciseId ?? 'new'}-${aiExercise.name}`,
      aiExercise,
      exercise,
      config: aiExerciseToConfig(aiExercise),
    }
  })
}

export interface AiPlanModalProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[] | undefined
  exercisesLoading: boolean
  exercisesError: unknown
  onExercisesRetry: () => void
  onConfirm: (items: PickedExerciseItem[]) => void
}

export function AiPlanModal({
  open,
  onClose,
  exercises,
  exercisesLoading,
  exercisesError,
  onExercisesRetry,
  onConfirm,
}: AiPlanModalProps) {
  const [goal, setGoal] = useState<AiGoal>('general_fitness')
  const [sessionMinutes, setSessionMinutes] = useState('60')
  const [level, setLevel] = useState<AiFitnessLevel>('beginner')
  const [equipmentText, setEquipmentText] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [generatedDay, setGeneratedDay] = useState<AiGeneratedDay | null>(null)
  const [configOverrides, setConfigOverrides] = useState<
    Record<string, ExerciseConfigFormValues>
  >({})

  const generateWorkoutPlan = useGenerateWorkoutPlan()
  const isGenerating = generateWorkoutPlan.isPending

  const exerciseById = useMemo(() => {
    if (!exercises) return new Map<number, Exercise>()
    return new Map(exercises.map((exercise) => [exercise.id, exercise]))
  }, [exercises])

  const validationError = useMemo(() => {
    const minutes = Number(sessionMinutes)
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 180) {
      return 'Thời lượng buổi tập phải từ 15 đến 180 phút'
    }
    if (notes.length > MAX_NOTES_LENGTH) {
      return `Ghi chú tối đa ${MAX_NOTES_LENGTH} ký tự`
    }
    return null
  }, [sessionMinutes, notes])

  const previewRows = useMemo(() => {
    if (!generatedDay || !exercises) return null
    return buildPreviewRows(generatedDay.exercises, exerciseById).map((row) => ({
      ...row,
      config: configOverrides[row.key] ?? row.config,
    }))
  }, [generatedDay, exercises, exerciseById, configOverrides])

  const mappedCount = useMemo(
    () => (previewRows ?? []).filter((row) => row.exercise != null).length,
    [previewRows],
  )

  const unmappedCount = useMemo(
    () => (previewRows ?? []).filter((row) => row.exercise == null).length,
    [previewRows],
  )

  const canConfirm =
    mappedCount > 0 &&
    !isGenerating &&
    !exercisesLoading &&
    !exercisesError &&
    previewRows != null &&
    previewRows.length > 0

  function resetModalState() {
    setGoal('general_fitness')
    setSessionMinutes('60')
    setLevel('beginner')
    setEquipmentText('')
    setNotes('')
    setFormError(null)
    setGeneratedDay(null)
    setConfigOverrides({})
    generateWorkoutPlan.reset()
  }

  function handleClose() {
    resetModalState()
    onClose()
  }

  function updatePreviewConfig(key: string, next: ExerciseConfigFormValues) {
    setConfigOverrides((prev) => ({ ...prev, [key]: next }))
  }

  function handleGenerateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isGenerating) return
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (exercisesLoading) {
      setFormError('Đang tải thư viện bài tập, vui lòng đợi.')
      return
    }
    if (exercisesError) {
      setFormError('Không tải được thư viện bài tập. Thử tải lại trước khi tạo kế hoạch.')
      return
    }

    setFormError(null)
    setGeneratedDay(null)
    setConfigOverrides({})

    const payload: AiWorkoutPlanRequest = {
      goal,
      daysPerWeek: 1,
      sessionMinutes: Number(sessionMinutes),
      level,
      equipment: equipmentText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      notes: notes.trim() || undefined,
    }

    generateWorkoutPlan.mutate(payload, {
      onSuccess: (data) => {
        setConfigOverrides({})
        const firstDay = data.plan.days[0]
        setGeneratedDay(
          firstDay ?? { dayIndex: 0, title: 'Buổi tập gợi ý', exercises: [] },
        )
      },
    })
  }

  function handleConfirm() {
    if (!previewRows || previewRows.length === 0) return
    if (exercisesLoading || exercisesError) return

    const mappedRows = previewRows.filter((row) => row.exercise != null)
    if (mappedRows.length === 0) {
      toast.error(NO_MAPPED_ERROR)
      return
    }

    const items: PickedExerciseItem[] = mappedRows.map((row) => ({
      exercise: row.exercise!,
      sets: row.config.sets,
      reps: row.config.reps,
      weight: row.config.weight,
      rest_time_seconds: row.config.rest_time_seconds,
      comment: row.config.comment ?? '',
    }))

    onConfirm(items)

    if (unmappedCount > 0) {
      toast(UNMAPPED_TOAST, { icon: '⚠️', duration: 6000 })
    } else {
      toast.success(`Đã thêm ${items.length} bài tập vào form`)
    }

    handleClose()
  }

  const showPreview = generatedDay != null
  const previewIsEmpty =
    generatedDay != null &&
    !exercisesLoading &&
    !exercisesError &&
    exercises != null &&
    (previewRows == null || previewRows.length === 0)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI Plan — Gợi ý buổi tập"
      description="Tạo nhanh một buổi tập từ AI và thêm bài đã có trong thư viện vào form."
      size="xl"
      footer={
        showPreview ? (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Thêm {mappedCount > 0 ? mappedCount : ''} bài vào form
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-6 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
        {!showPreview && (
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Mục tiêu"
                value={goal}
                onChange={(e) => setGoal(e.target.value as AiGoal)}
                options={GOAL_OPTIONS}
                disabled={isGenerating}
              />
              <Select
                label="Trình độ"
                value={level}
                onChange={(e) => setLevel(e.target.value as AiFitnessLevel)}
                options={LEVEL_OPTIONS}
                disabled={isGenerating}
              />
              <Input
                label="Thời lượng buổi tập (phút)"
                type="number"
                min={15}
                max={180}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(e.target.value)}
                disabled={isGenerating}
                required
              />
              <Input
                label="Thiết bị (phân cách bằng dấu phẩy)"
                placeholder="dumbbell, barbell, machine"
                value={equipmentText}
                onChange={(e) => setEquipmentText(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <Textarea
              label="Ghi chú thêm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={MAX_NOTES_LENGTH}
              rows={3}
              disabled={isGenerating}
              helperText={`${notes.length}/${MAX_NOTES_LENGTH} — Tùy chọn`}
            />

            {(formError || validationError) && (
              <p className="text-xs text-danger" role="alert">
                {formError ?? validationError}
              </p>
            )}

            {exercisesLoading && (
              <p className="text-xs text-muted" role="status">
                Đang tải thư viện bài tập...
              </p>
            )}

            {exercisesError != null && !exercisesLoading && (
              <ErrorState error={exercisesError} onRetry={onExercisesRetry} />
            )}

            <Button
              type="submit"
              loading={isGenerating}
              disabled={!!validationError || isGenerating || exercisesLoading || !!exercisesError}
              leftIcon={<Sparkles size={16} />}
            >
              {isGenerating ? 'AI đang tạo buổi tập...' : 'Tạo gợi ý buổi tập'}
            </Button>
          </form>
        )}

        {generateWorkoutPlan.isError && (
          <Card className="border-danger/40 bg-danger-bg/20">
            <CardBody>
              <div className="flex gap-3 items-start">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm text-danger" role="alert">
                  {getErrorMessage(generateWorkoutPlan.error)}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {showPreview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {generatedDay?.title ?? 'Buổi tập gợi ý'}
                </p>
                {generatedDay?.focus && (
                  <p className="text-xs text-muted mt-0.5">{generatedDay.focus}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Chỉ áp dụng ngày đầu tiên của kế hoạch (1 buổi/tuần).
                  {mappedCount > 0 && (
                    <>
                      {' '}
                      · {mappedCount} bài khớp thư viện
                      {unmappedCount > 0 ? ` · ${unmappedCount} chưa khớp` : ''}
                    </>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setGeneratedDay(null)
                  setConfigOverrides({})
                  generateWorkoutPlan.reset()
                }}
                disabled={isGenerating}
              >
                Tạo lại
              </Button>
            </div>

            {exercisesLoading && (
              <p className="text-sm text-muted" role="status">
                Đang tải thư viện bài tập để khớp bài AI...
              </p>
            )}

            {exercisesError != null && !exercisesLoading && (
              <ErrorState error={exercisesError} onRetry={onExercisesRetry} />
            )}

            {previewIsEmpty && (
              <EmptyState
                icon={<Sparkles size={24} />}
                title="Không có bài tập trong buổi gợi ý"
                description="AI không trả bài tập cho ngày đầu tiên. Thử tạo lại với ghi chú khác."
              />
            )}

            {previewRows != null && previewRows.length > 0 && (
              <ul className="space-y-4">
                {previewRows.map((row) => {
                  const isMapped = row.exercise != null
                  return (
                    <li
                      key={row.key}
                      className="rounded-xl border border-border/60 bg-surface/30 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {row.aiExercise.name}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {!isMapped && (
                              <Badge variant="warning">Chưa có trong DB</Badge>
                            )}
                            {isMapped && row.exercise.category && (
                              <Badge variant="neutral">{row.exercise.category.name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {isMapped ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            label="Sets"
                            type="number"
                            min={1}
                            value={row.config.sets}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updatePreviewConfig(row.key, {
                                ...row.config,
                                sets: clamp(n, 1, 10),
                              })
                            }}
                          />
                          <Input
                            label="Reps"
                            type="number"
                            min={1}
                            value={row.config.reps}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updatePreviewConfig(row.key, {
                                ...row.config,
                                reps: clamp(n, 1, 100),
                              })
                            }}
                          />
                          <Input
                            label="Cân nặng (kg)"
                            type="number"
                            min={0}
                            step="0.5"
                            value={row.config.weight}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updatePreviewConfig(row.key, {
                                ...row.config,
                                weight: Math.max(0, n),
                              })
                            }}
                          />
                          <Input
                            label="Nghỉ (giây)"
                            type="number"
                            min={0}
                            value={row.config.rest_time_seconds}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updatePreviewConfig(row.key, {
                                ...row.config,
                                rest_time_seconds: clamp(n, 0, 600),
                              })
                            }}
                          />
                          <Textarea
                            label="Ghi chú"
                            rows={2}
                            containerClassName="sm:col-span-2"
                            value={row.config.comment}
                            onChange={(e) =>
                              updatePreviewConfig(row.key, {
                                ...row.config,
                                comment: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted">
                          Bài này chưa có trong thư viện — không thêm vào form khi xác nhận.
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {previewRows != null &&
              previewRows.length > 0 &&
              mappedCount === 0 &&
              !exercisesLoading &&
              !exercisesError && (
                <p className="text-xs text-danger" role="alert">
                  {NO_MAPPED_ERROR}
                </p>
              )}
          </div>
        )}
      </div>
    </Modal>
  )
}
