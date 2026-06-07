import { useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { useGenerateWorkoutPlan } from '@/hooks/ai/useGenerateWorkoutPlan'
import { useApplyAiRecommendation } from '@/hooks/ai/useApplyAiRecommendation'
import { getAiFriendlyErrorMessage } from '@/lib/aiError'
import type {
  AiFitnessLevel,
  AiGeneratedExercise,
  AiGeneratedPlan,
  AiGoal,
  AiWorkoutPlanRequest,
} from '@/types/ai.types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

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

const GENDER_OPTIONS = [
  { value: '', label: 'Không chọn' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

const MAX_INJURY_LENGTH = 1000
const MAX_NOTES_LENGTH = 2000

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export function GeneratePlanTab() {
  const [goal, setGoal] = useState<AiGoal>('general_fitness')
  const [daysPerWeek, setDaysPerWeek] = useState('3')
  const [sessionMinutes, setSessionMinutes] = useState('60')
  const [level, setLevel] = useState<AiFitnessLevel>('beginner')
  const [equipmentText, setEquipmentText] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('')
  const [injuryOrLimitation, setInjuryOrLimitation] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [recommendationId, setRecommendationId] = useState<number | null>(null)
  const [editablePlan, setEditablePlan] = useState<AiGeneratedPlan | null>(null)
  const [selectedDayIndexes, setSelectedDayIndexes] = useState<number[]>([])
  const [hasApplied, setHasApplied] = useState(false)
  const [applyResult, setApplyResult] = useState<{ message: string; workoutIds: number[] } | null>(
    null,
  )

  const generateWorkoutPlan = useGenerateWorkoutPlan()
  const applyAiRecommendation = useApplyAiRecommendation()

  const isGenerating = generateWorkoutPlan.isPending
  const isApplying = applyAiRecommendation.isPending

  const validationError = useMemo(() => {
    const days = Number(daysPerWeek)
    const minutes = Number(sessionMinutes)
    if (!Number.isFinite(days) || days < 1 || days > 7) {
      return 'Số ngày/tuần phải từ 1 đến 7'
    }
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 180) {
      return 'Thời lượng buổi tập phải từ 15 đến 180 phút'
    }
    const h = parseOptionalNumber(height)
    if (height.trim() && (h == null || h < 50 || h > 250)) {
      return 'Chiều cao phải từ 50 đến 250 cm'
    }
    const w = parseOptionalNumber(weight)
    if (weight.trim() && (w == null || w < 20 || w > 300)) {
      return 'Cân nặng phải từ 20 đến 300 kg'
    }
    if (injuryOrLimitation.length > MAX_INJURY_LENGTH) {
      return `Chấn thương/giới hạn tối đa ${MAX_INJURY_LENGTH} ký tự`
    }
    if (notes.length > MAX_NOTES_LENGTH) {
      return `Ghi chú tối đa ${MAX_NOTES_LENGTH} ký tự`
    }
    return null
  }, [daysPerWeek, sessionMinutes, height, weight, injuryOrLimitation, notes])

  const selectedDayHasNoExercises = useMemo(() => {
    if (!editablePlan) return false
    return selectedDayIndexes.some((dayIndex) => {
      const day = editablePlan.days.find((d) => d.dayIndex === dayIndex)
      return !day || day.exercises.length === 0
    })
  }, [editablePlan, selectedDayIndexes])

  const canApply =
    recommendationId != null &&
    editablePlan != null &&
    selectedDayIndexes.length > 0 &&
    !hasApplied &&
    !isApplying &&
    !selectedDayHasNoExercises

  function toggleDay(dayIndex: number) {
    setSelectedDayIndexes((prev) =>
      prev.includes(dayIndex) ? prev.filter((i) => i !== dayIndex) : [...prev, dayIndex],
    )
  }

  function updateExercise(
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<AiGeneratedExercise>,
  ) {
    setEditablePlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map((day) => {
          if (day.dayIndex !== dayIndex) return day
          return {
            ...day,
            exercises: day.exercises.map((ex, idx) =>
              idx === exerciseIndex ? { ...ex, ...patch } : ex,
            ),
          }
        }),
      }
    })
  }

  function removeExercise(dayIndex: number, exerciseIndex: number) {
    setEditablePlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map((day) => {
          if (day.dayIndex !== dayIndex) return day
          return {
            ...day,
            exercises: day.exercises.filter((_, idx) => idx !== exerciseIndex),
          }
        }),
      }
    })
  }

  function handleGenerateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isGenerating) return
    if (validationError) {
      setFormError(validationError)
      return
    }
    setFormError(null)
    setApplyResult(null)

    const payload: AiWorkoutPlanRequest = {
      goal,
      daysPerWeek: Number(daysPerWeek),
      sessionMinutes: Number(sessionMinutes),
      level,
      equipment: equipmentText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      height: parseOptionalNumber(height),
      weight: parseOptionalNumber(weight),
      gender: gender || undefined,
      injuryOrLimitation: injuryOrLimitation.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    generateWorkoutPlan.mutate(payload, {
      onSuccess: (data) => {
        setRecommendationId(data.recommendationId)
        setEditablePlan(data.plan)
        setSelectedDayIndexes(data.plan.days.map((day) => day.dayIndex))
        setHasApplied(false)
        setApplyResult(null)
      },
    })
  }

  function handleApply() {
    if (!canApply || recommendationId == null || !editablePlan) return

    applyAiRecommendation.mutate(
      {
        id: recommendationId,
        payload: {
          selectedDayIndexes,
          editedPlan: editablePlan,
        },
      },
      {
        onSuccess: (data) => {
          setHasApplied(true)
          setApplyResult({ message: data.message, workoutIds: data.workoutIds })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerateSubmit} className="space-y-5">
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
            label="Số ngày/tuần"
            type="number"
            min={1}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            disabled={isGenerating}
            required
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
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Chiều cao (cm)"
            type="number"
            min={50}
            max={250}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            disabled={isGenerating}
            helperText="Tùy chọn"
          />
          <Input
            label="Cân nặng (kg)"
            type="number"
            min={20}
            max={300}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isGenerating}
            helperText="Tùy chọn"
          />
          <Select
            label="Giới tính"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={GENDER_OPTIONS}
            disabled={isGenerating}
            containerClassName="sm:col-span-2"
          />
        </div>

        <Textarea
          label="Chấn thương / giới hạn"
          value={injuryOrLimitation}
          onChange={(e) => setInjuryOrLimitation(e.target.value)}
          maxLength={MAX_INJURY_LENGTH}
          rows={3}
          disabled={isGenerating}
          helperText={`${injuryOrLimitation.length}/${MAX_INJURY_LENGTH} — Tùy chọn`}
        />

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

        <Button type="submit" loading={isGenerating} disabled={!!validationError || isGenerating}>
          {isGenerating ? 'AI đang tạo kế hoạch...' : 'Tạo kế hoạch AI'}
        </Button>
      </form>

      {generateWorkoutPlan.isError && (
        <Card className="border-danger/40 bg-danger-bg/20">
          <CardBody>
            <div className="flex gap-3 items-start">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-danger" role="alert">
                {getAiFriendlyErrorMessage(generateWorkoutPlan.error)}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {editablePlan && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3 mb-0 border-b-0">
              <CardTitle>Tóm tắt kế hoạch</CardTitle>
            </CardHeader>
            <CardBody className="pt-0 space-y-2 text-sm">
              {editablePlan.summary && (
                <p className="text-foreground leading-relaxed">{editablePlan.summary}</p>
              )}
              <p className="text-muted">
                Mục tiêu: {GOAL_OPTIONS.find((o) => o.value === editablePlan.goal)?.label ?? editablePlan.goal}
                {' · '}
                {editablePlan.daysPerWeek} ngày/tuần · {editablePlan.sessionMinutes} phút/buổi ·{' '}
                {LEVEL_OPTIONS.find((o) => o.value === editablePlan.level)?.label ?? editablePlan.level}
              </p>
              {generateWorkoutPlan.data?.usage?.totalTokens != null && (
                <p className="text-xs text-muted">
                  Tokens: {generateWorkoutPlan.data.usage.totalTokens}
                </p>
              )}
            </CardBody>
          </Card>

          {editablePlan.days.map((day) => {
            const isSelected = selectedDayIndexes.includes(day.dayIndex)
            return (
              <Card
                key={day.dayIndex}
                className={isSelected ? 'border-accent/40' : 'border-border/60 opacity-90'}
              >
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Checkbox
                      label={`${day.title}${day.focus ? ` — ${day.focus}` : ''}`}
                      description={
                        [
                          day.estimatedMinutes != null ? `~${day.estimatedMinutes} phút` : null,
                          `${day.exercises.length} bài tập`,
                          isSelected ? 'Đã chọn' : 'Chưa chọn',
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      }
                      checked={isSelected}
                      onChange={() => toggleDay(day.dayIndex)}
                      disabled={isApplying || hasApplied}
                    />
                    <Badge variant={isSelected ? 'accent' : 'neutral'}>
                      {isSelected ? 'Đã chọn' : 'Bỏ chọn'}
                    </Badge>
                  </div>

                  {isSelected && day.exercises.length === 0 && (
                    <p className="text-xs text-warning" role="status">
                      Ngày này không còn bài tập — bỏ chọn hoặc không thể áp dụng.
                    </p>
                  )}

                  <ul className="space-y-4">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <li
                        key={`${day.dayIndex}-${exerciseIndex}-${exercise.name}`}
                        className="rounded-xl border border-border/60 bg-surface/30 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {exercise.exerciseId === null && (
                                <Badge variant="accent">AI Generated</Badge>
                              )}
                              {exercise.category && (
                                <Badge variant="neutral">{exercise.category}</Badge>
                              )}
                              {exercise.primaryMuscleGroup && (
                                <Badge variant="info">{exercise.primaryMuscleGroup}</Badge>
                              )}
                            </div>
                            {(exercise.secondaryMuscleGroups?.length ?? 0) > 0 && (
                              <p className="text-xs text-muted mt-1">
                                {exercise.secondaryMuscleGroups!.join(', ')}
                              </p>
                            )}
                            {(exercise.equipment || exercise.difficultyLevel) && (
                              <p className="text-xs text-muted mt-0.5">
                                {[exercise.equipment, exercise.difficultyLevel]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removeExercise(day.dayIndex, exerciseIndex)}
                            disabled={isApplying || hasApplied}
                            aria-label={`Xóa ${exercise.name}`}
                          >
                            <Trash2 size={14} aria-hidden />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Input
                            label="Sets"
                            type="number"
                            min={1}
                            max={10}
                            value={exercise.sets}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updateExercise(day.dayIndex, exerciseIndex, {
                                sets: clamp(n, 1, 10),
                              })
                            }}
                            disabled={isApplying || hasApplied}
                          />
                          <Input
                            label="Reps"
                            type="number"
                            min={1}
                            max={100}
                            value={exercise.reps}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              if (!Number.isFinite(n)) return
                              updateExercise(day.dayIndex, exerciseIndex, {
                                reps: clamp(n, 1, 100),
                              })
                            }}
                            disabled={isApplying || hasApplied}
                          />
                          <Input
                            label="Weight (kg)"
                            type="number"
                            min={0}
                            value={exercise.weight ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === '') {
                                updateExercise(day.dayIndex, exerciseIndex, { weight: undefined })
                                return
                              }
                              const n = Number(raw)
                              if (!Number.isFinite(n)) return
                              updateExercise(day.dayIndex, exerciseIndex, {
                                weight: Math.max(0, n),
                              })
                            }}
                            disabled={isApplying || hasApplied}
                          />
                          <Input
                            label="Nghỉ (giây)"
                            type="number"
                            min={0}
                            max={600}
                            value={exercise.restTimeSeconds ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === '') {
                                updateExercise(day.dayIndex, exerciseIndex, {
                                  restTimeSeconds: undefined,
                                })
                                return
                              }
                              const n = Number(raw)
                              if (!Number.isFinite(n)) return
                              updateExercise(day.dayIndex, exerciseIndex, {
                                restTimeSeconds: clamp(n, 0, 600),
                              })
                            }}
                            disabled={isApplying || hasApplied}
                          />
                        </div>

                        <Textarea
                          label="Ghi chú bài tập"
                          rows={2}
                          value={exercise.notes ?? ''}
                          onChange={(e) =>
                            updateExercise(day.dayIndex, exerciseIndex, {
                              notes: e.target.value || undefined,
                            })
                          }
                          disabled={isApplying || hasApplied}
                        />
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )
          })}

          {selectedDayHasNoExercises && (
            <p className="text-xs text-warning" role="status">
              Một hoặc nhiều ngày đã chọn không còn bài tập — không thể áp dụng.
            </p>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <Button
              type="button"
              onClick={handleApply}
              loading={isApplying}
              disabled={!canApply}
            >
              {isApplying ? 'Đang áp dụng...' : 'Áp dụng các ngày đã chọn'}
            </Button>
            {hasApplied && (
              <Badge variant="success" dot>
                Đã áp dụng
              </Badge>
            )}
          </div>

          {applyAiRecommendation.isError && (
            <Card className="border-danger/40 bg-danger-bg/20">
              <CardBody>
                <div className="flex gap-3 items-start">
                  <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm text-danger" role="alert">
                    {getAiFriendlyErrorMessage(applyAiRecommendation.error)}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {hasApplied && applyResult && (
            <Card className="border-success/40 bg-success-bg/20">
              <CardBody>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" aria-hidden />
                  <div className="text-sm text-foreground space-y-1">
                    <p>{applyResult.message}</p>
                    {applyResult.workoutIds.length > 0 && (
                      <p className="text-xs text-muted">
                        Workout IDs: {applyResult.workoutIds.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
