import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Play, CheckCircle2, Pencil, Trash2, Plus, Dumbbell,
  CalendarDays, FileText, Clock, Flame, X, MoreHorizontal
} from 'lucide-react'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Button }       from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Modal }        from '@/components/ui/Modal'
import { Dropdown }     from '@/components/ui/Dropdown'
import { Input }        from '@/components/ui/Input'
import { SearchInput }  from '@/components/ui/SearchInput'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState }   from '@/components/ui/ErrorState'
import { EmptyState }   from '@/components/ui/EmptyState'
import { useWorkoutList }    from '@/hooks/workout/useWorkoutList'
import { useDeleteWorkout }  from '@/hooks/workout/useDeleteWorkout'
import { useStartWorkout }   from '@/hooks/workout/useStartWorkout'
import { useCompleteWorkout } from '@/hooks/workout/useCompleteWorkout'
import { useAddExerciseToWorkout, useUpdateExerciseInWorkout, useRemoveExerciseFromWorkout } from '@/hooks/workout/useWorkoutExercises'
import { useExerciseList }   from '@/hooks/exercise/useExerciseList'
import { ROUTES, WORKOUT_STATUS, WORKOUT_STATUS_LABELS, DIFFICULTY_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import {
  formatDate,
  formatDatetime,
  formatDuration,
  formatCalories,
  cn,
  computeWorkoutExerciseEnergyRows,
} from '@/lib/utils'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { WorkoutExercise } from '@/types/workout.types'

const statusVariant: Record<string, BadgeVariant> = {
  pending: 'neutral', in_progress: 'info', completed: 'success',
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const workoutId = Number(id)
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)

  const [showDelete,    setShowDelete]    = useState(false)
  const [showComplete,  setShowComplete]  = useState(false)
  const [showAddEx,     setShowAddEx]     = useState(false)
  const [exSearch,      setExSearch]      = useState('')
  const [deleteExId,    setDeleteExId]    = useState<number | null>(null)
  const [editingEx,     setEditingEx]     = useState<WorkoutExercise | null>(null)

  const { data: workouts, isLoading, error, refetch } = useWorkoutList()
  const workout = useMemo(() => workouts?.find((w) => w.id === workoutId), [workouts, workoutId])

  const { data: exercises } = useExerciseList()

  const deleteMutation   = useDeleteWorkout()
  const startMutation    = useStartWorkout()
  const completeMutation = useCompleteWorkout()
  const addExMutation    = useAddExerciseToWorkout(workoutId)
  const updateExMutation = useUpdateExerciseInWorkout(workoutId)
  const removeExMutation = useRemoveExerciseFromWorkout(workoutId)

  const filteredExercises = useMemo(
    () => (exercises ?? []).filter((e) =>
      !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase())
    ),
    [exercises, exSearch],
  )

  if (isLoading) return <FullPageSpinner />
  if (error)     return <ErrorState error={error} onRetry={refetch} />
  if (!workout)  return <ErrorState message="Không tìm thấy buổi tập" />

  const isPending     = workout.status === WORKOUT_STATUS.PENDING
  const isInProgress  = workout.status === WORKOUT_STATUS.IN_PROGRESS
  const isCompleted   = workout.status === WORKOUT_STATUS.COMPLETED
  const canEdit       = !isCompleted

  const energyMetrics = useMemo(
    () => computeWorkoutExerciseEnergyRows(workout.exercises, workout.log, user?.weight ?? 70),
    [workout.exercises, workout.log, user?.weight],
  )

  const durationLabelExtra =
    workout.exercises.length > 0 && !energyMetrics.isActualTotals ? ' · Ước tính' : ''
  const caloriesLabelExtra = durationLabelExtra

  return (
    <div className="space-y-5 animate-fade-up max-w-4xl">
      {/* Header */}
      <PageHeader
        title={workout.title.toUpperCase()}
        action={
          <div className="flex items-center gap-2">
            {isPending && (
              <Button
                leftIcon={<Play size={14} />}
                onClick={() => startMutation.mutate(workoutId)}
                loading={startMutation.isPending}
              >
                Bắt đầu
              </Button>
            )}
            {isInProgress && (
              <Button
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() => setShowComplete(true)}
              >
                Hoàn thành
              </Button>
            )}
            {canEdit && (
              <Button
                variant="secondary"
                leftIcon={<Pencil size={14} />}
                onClick={() => navigate(ROUTES.WORKOUT_EDIT(workoutId))}
              >
                Chỉnh sửa
              </Button>
            )}
            <Button
              variant="danger"
              size="icon"
              onClick={() => setShowDelete(true)}
              aria-label="Xóa"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoTile icon={<Badge variant={statusVariant[workout.status]} dot>{WORKOUT_STATUS_LABELS[workout.status]}</Badge>} label="Trạng thái" />
        <InfoTile icon={<span className="text-sm text-muted">{formatDate(workout.scheduled_at)}</span>} label="Lịch tập" iconComp={<CalendarDays size={14} className="text-muted" />} />
        <InfoTile
          icon={
            <span className="text-sm text-foreground font-medium tabular-nums">
              {energyMetrics.totalDurationMinutes > 0
                ? formatDuration(energyMetrics.totalDurationMinutes)
                : '—'}
            </span>
          }
          label={`Thời lượng${durationLabelExtra}`}
          iconComp={<Clock size={14} className="text-muted" />}
        />
        <InfoTile
          icon={
            <span className="text-sm text-foreground font-medium tabular-nums">
              {energyMetrics.totalCalories > 0 ? formatCalories(energyMetrics.totalCalories) : '—'}
            </span>
          }
          label={`Calo${caloriesLabelExtra}`}
          iconComp={<Flame size={14} className="text-accent" />}
        />
        {workout.notes && (
          <div className="col-span-2 sm:col-span-4">
            <Card padding="sm" className="flex items-start gap-2">
              <FileText size={14} className="text-muted shrink-0 mt-0.5" />
              <p className="text-sm text-muted">{workout.notes}</p>
            </Card>
          </div>
        )}
      </div>

      {/* Exercises */}
      <Card padding="none">
        <CardHeader className="px-5 py-4">
          <CardTitle>Danh sách bài tập ({workout.exercises.length})</CardTitle>
          {canEdit && (
            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowAddEx(true)}>
              Thêm bài tập
            </Button>
          )}
        </CardHeader>

        {workout.exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={24} />}
            title="Chưa có bài tập"
            description="Thêm bài tập vào buổi tập này"
            action={canEdit ? { label: 'Thêm bài tập', onClick: () => setShowAddEx(true) } : undefined}
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {workout.exercises.map((we, i) => (
              <ExerciseRow
                key={we.id}
                index={i + 1}
                item={we}
                durationMinutes={energyMetrics.rowDurationMinutes[i] ?? 0}
                caloriesBurned={energyMetrics.rowCalories[i] ?? 0}
                canEdit={canEdit}
                onEdit={() => setEditingEx(we)}
                onDelete={() => setDeleteExId(we.id)}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Completed at */}
      {isCompleted && workout.log && (
        <p className="text-xs text-muted text-right">
          Hoàn thành lúc {formatDatetime(workout.log.completed_at)}
        </p>
      )}

      {/* ── Modals ── */}
      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate(workoutId)}
        title="Xóa buổi tập?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        onConfirm={() => { completeMutation.mutate(workoutId); setShowComplete(false) }}
        title="Hoàn thành buổi tập?"
        description="Hệ thống sẽ tính toán thời gian và calo dựa trên thời điểm bắt đầu."
        confirmLabel="Xác nhận hoàn thành"
        variant="warning"
        isLoading={completeMutation.isPending}
      />

      {/* Add exercise modal */}
      <Modal open={showAddEx} onClose={() => setShowAddEx(false)} title="Thêm bài tập" size="lg">
        <SearchInput value={exSearch} onChange={setExSearch} placeholder="Tìm bài tập..." className="mb-4" />
        <div className="max-h-80 overflow-y-auto space-y-1 -mx-1 px-1">
          {filteredExercises.map((ex) => {
            const alreadyAdded = workout.exercises.some((we) => we.exercise_id === ex.id)
            return (
              <button
                key={ex.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => {
                  addExMutation.mutate({ exerciseId: ex.id, payload: { sets: 3, reps: 10 } })
                  setShowAddEx(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left',
                  'transition-colors duration-100',
                  alreadyAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-card-raised cursor-pointer',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted">
                    {ex.category?.name && `${ex.category.name} · `}
                    {DIFFICULTY_LABELS[ex.difficulty_level]}
                  </p>
                </div>
                {alreadyAdded && <span className="text-xs text-success">Đã thêm</span>}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Edit exercise modal */}
      <EditExerciseModal
        item={editingEx}
        onClose={() => setEditingEx(null)}
        onSave={(payload) => {
          if (editingEx) updateExMutation.mutate({ exerciseId: editingEx.exercise_id, payload })
          setEditingEx(null)
        }}
        isLoading={updateExMutation.isPending}
      />

      <ConfirmModal
        open={deleteExId !== null}
        onClose={() => setDeleteExId(null)}
        onConfirm={() => { if (deleteExId) removeExMutation.mutate(deleteExId); setDeleteExId(null) }}
        title="Xóa bài tập khỏi buổi tập?"
        confirmLabel="Xóa"
        isLoading={removeExMutation.isPending}
      />
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function InfoTile({ icon, label, iconComp }: { icon: React.ReactNode; label: string; iconComp?: React.ReactNode }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-muted flex items-center gap-1 mb-1">{iconComp}{label}</p>
      <div>{icon}</div>
    </Card>
  )
}

function ExerciseRow({
  index,
  item,
  durationMinutes,
  caloriesBurned,
  canEdit,
  onEdit,
  onDelete,
}: {
  index: number
  item: WorkoutExercise
  durationMinutes: number
  caloriesBurned: number
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5 group hover:bg-card/40 transition-colors">
      <span className="text-xs text-subtle font-medium w-5 shrink-0">{index}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {item.exercise?.name ?? `Exercise #${item.exercise_id}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Pill>{item.sets} sets</Pill>
          <Pill>{item.reps} reps</Pill>
          {item.weight > 0 && <Pill>{item.weight} kg</Pill>}
          {item.rest_time_seconds > 0 && <Pill>Nghỉ {item.rest_time_seconds}s</Pill>}
          {(durationMinutes > 0 || caloriesBurned > 0) && (
            <>
              <Pill className="inline-flex items-center gap-1">
                <Clock size={11} aria-hidden />
                {formatDuration(durationMinutes)}
              </Pill>
              <Pill className="inline-flex items-center gap-1">
                <Flame size={11} className="text-accent" aria-hidden />
                {formatCalories(caloriesBurned)}
              </Pill>
            </>
          )}
        </div>
      </div>
      {canEdit && (
        <Dropdown
          trigger={
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal size={14} />
            </Button>
          }
          items={[
            { label: 'Chỉnh sửa', icon: <Pencil size={12} />, onClick: onEdit },
            { label: 'Xóa',       icon: <X size={12} />,      onClick: onDelete, danger: true },
          ]}
          align="right"
        />
      )}
    </li>
  )
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('text-xs text-muted bg-card-raised px-2 py-0.5 rounded-md', className)}>
      {children}
    </span>
  )
}

function EditExerciseModal({
  item, onClose, onSave, isLoading,
}: {
  item: WorkoutExercise | null
  onClose: () => void
  onSave: (p: { sets: number; reps: number; weight: number; rest_time_seconds: number; comment: string }) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({ sets: 3, reps: 10, weight: 0, rest_time_seconds: 60, comment: '' })

  useEffect(() => {
    if (item) setForm({
      sets: item.sets, reps: item.reps, weight: item.weight,
      rest_time_seconds: item.rest_time_seconds, comment: item.comment ?? '',
    })
  }, [item])

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={`Chỉnh sửa: ${item?.exercise?.name ?? ''}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button>
          <Button size="sm" loading={isLoading} onClick={() => onSave(form)}>Lưu</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Sets" type="number" value={form.sets} onChange={(e) => setForm(f => ({ ...f, sets: +e.target.value }))} />
        <Input label="Reps" type="number" value={form.reps} onChange={(e) => setForm(f => ({ ...f, reps: +e.target.value }))} />
        <Input label="Cân nặng (kg)" type="number" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: +e.target.value }))} />
        <Input label="Nghỉ (giây)" type="number" value={form.rest_time_seconds} onChange={(e) => setForm(f => ({ ...f, rest_time_seconds: +e.target.value }))} />
      </div>
    </Modal>
  )
}
