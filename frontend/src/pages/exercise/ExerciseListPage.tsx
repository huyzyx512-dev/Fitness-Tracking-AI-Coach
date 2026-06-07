import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Activity, MoreHorizontal, Pencil, Trash2, Dumbbell, Clock, Flame } from 'lucide-react'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Button }       from '@/components/ui/Button'
import { Badge }        from '@/components/ui/Badge'
import { SearchInput }  from '@/components/ui/SearchInput'
import { Select }       from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Dropdown }     from '@/components/ui/Dropdown'
import { ErrorState }   from '@/components/ui/ErrorState'
import { EmptyState }   from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useExerciseList }   from '@/hooks/exercise/useExerciseList'
import { useDeleteExercise } from '@/hooks/exercise/useDeleteExercise'
import { useAuthStore }  from '@/store/auth.store'
import { ROUTES, DIFFICULTY_LABELS, ROLE } from '@/lib/constants'
import { formatDuration, formatCalories, estimateCaloriesBurnedMet } from '@/lib/utils'
import type { Exercise } from '@/types/exercise.types'
import type { BadgeVariant } from '@/components/ui/Badge'

/* Keys must match backend enum values */
const difficultyVariant: Record<string, BadgeVariant> = {
  'cơ bản':     'success',
  'trung bình': 'warning',
  'nâng cao':   'danger',
}

export default function ExerciseListPage() {
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const isAdmin    = user?.role?.name === ROLE.ADMIN
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('')
  const [diffFilter,setDiffFilter]=useState('')
  const [creatorFilter, setCreatorFilter] = useState<'' | 'mine'>('')
  const [muscleFilterMode, setMuscleFilterMode] = useState<'single' | 'multi'>('single')
  const [singleMuscleId, setSingleMuscleId] = useState('')
  const [multiMuscleIds, setMultiMuscleIds] = useState<number[]>([])
  const [muscleMatch, setMuscleMatch] = useState<'any' | 'all'>('any')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const selectedMuscleIds = muscleFilterMode === 'single'
    ? (singleMuscleId ? [Number(singleMuscleId)] : [])
    : multiMuscleIds

  const { data: exercises, isLoading, error, refetch } = useExerciseList({
    muscle_group_ids: selectedMuscleIds,
    muscle_match: muscleMatch,
  })
  const deleteMutation = useDeleteExercise()

  const categories = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) => { if (e.category) map.set(e.category.id, e.category.name) })
    return [{ value: '', label: 'Tất cả nhóm' }, ...[...map.entries()].map(([v, l]) => ({ value: String(v), label: l }))]
  }, [exercises])

  const diffOptions = [
    { value: '', label: 'Tất cả mức độ' },
    ...Object.entries(DIFFICULTY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ]
  const muscleModeOptions = [
    { value: 'single', label: '1 nhóm cơ' },
    { value: 'multi', label: 'Nhiều nhóm cơ' },
  ]
  const muscleMatchOptions = [
    { value: 'any', label: 'Khớp ít nhất 1 nhóm (OR)' },
    { value: 'all', label: 'Khớp tất cả nhóm (AND)' },
  ]

  const creatorOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả' },
      ...(user?.id ? [{ value: 'mine' as const, label: 'Bài của tôi' }] : []),
    ],
    [user?.id],
  )

  const muscleGroups = useMemo(() => {
    const map = new Map<number, string>()
    exercises?.forEach((e) => e.muscleGroups?.forEach((mg) => map.set(mg.id, mg.name)))
    return [...map.entries()]
      .map(([value, label]) => ({ value: String(value), label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [exercises])

  const muscleSelectOptions = useMemo(
    () => [{ value: '', label: 'Tất cả nhóm cơ' }, ...muscleGroups],
    [muscleGroups],
  )

  function toggleMultiMuscle(id: number) {
    setMultiMuscleIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises
      .filter((e) => !search     || e.name.toLowerCase().includes(search.toLowerCase()))
      .filter((e) => !catFilter  || String(e.category_id) === catFilter)
      .filter((e) => !diffFilter || e.difficulty_level === diffFilter)
      .filter((e) => {
        if (creatorFilter !== 'mine' || !user) return true
        return e.created_by === user.id
      })
  }, [exercises, search, catFilter, diffFilter, creatorFilter, user])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const canCreate = !!user

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="BÀI TẬP"
        description={`Thư viện ${exercises?.length ?? 0} bài tập`}
        action={
          canCreate && (
            <Button leftIcon={<Plus size={15} />} onClick={() => navigate(`${ROUTES.EXERCISES}/new`)}>
              Tạo bài tập
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm bài tập..." className="flex-1" />
        <Select options={categories} value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="sm:w-44" />
        <Select options={diffOptions} value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)} className="sm:w-40" />
        {user?.id && (
          <Select
            options={creatorOptions}
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value as '' | 'mine')}
            className="sm:w-40"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface/40 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            options={muscleModeOptions}
            value={muscleFilterMode}
            onChange={(e) => {
              const nextMode = e.target.value as 'single' | 'multi'
              setMuscleFilterMode(nextMode)
              setSingleMuscleId('')
              setMultiMuscleIds([])
              setMuscleMatch('any')
            }}
            className="sm:w-44"
          />
          {muscleFilterMode === 'single' ? (
            <Select
              options={muscleSelectOptions}
              value={singleMuscleId}
              onChange={(e) => setSingleMuscleId(e.target.value)}
              className="sm:w-64"
            />
          ) : (
            <Select
              options={muscleMatchOptions}
              value={muscleMatch}
              onChange={(e) => setMuscleMatch(e.target.value as 'any' | 'all')}
              className="sm:w-64"
            />
          )}
        </div>

        {muscleFilterMode === 'multi' && (
          muscleGroups.length === 0 ? (
            <p className="text-xs text-muted italic">
              Không có nhóm cơ để lọc theo danh sách hiện tại.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((mg) => {
                const id = Number(mg.value)
                const isActive = multiMuscleIds.includes(id)
                return (
                  <button
                    key={mg.value}
                    type="button"
                    onClick={() => toggleMultiMuscle(id)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
                  >
                    <Badge variant={isActive ? 'accent' : 'neutral'} className="cursor-pointer transition-all hover:opacity-80">
                      {mg.label}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Activity size={24} />}
          title="Không tìm thấy bài tập"
          description="Thử thay đổi bộ lọc hoặc tạo bài tập mới"
          action={canCreate ? { label: 'Tạo bài tập', onClick: () => navigate(`${ROUTES.EXERCISES}/new`) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              weightKg={user?.weight ?? 70}
              canEdit={isAdmin || ex.created_by === user?.id}
              onOpenDetail={() => navigate(ROUTES.EXERCISE_DETAIL(ex.id))}
              onEdit={() => navigate(`${ROUTES.EXERCISES}/${ex.id}/edit`)}
              onDelete={() => setDeleteId(ex.id)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null) }}
        title="Xóa bài tập?"
        description="Bài tập sẽ bị xóa khỏi hệ thống."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function ExerciseCard({
  exercise,
  weightKg,
  canEdit,
  onOpenDetail,
  onEdit,
  onDelete,
}: {
  exercise: Exercise
  weightKg: number
  canEdit: boolean
  onOpenDetail: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const hasApiDuration =
    exercise.duration_minutes != null && exercise.duration_minutes > 0
  const hasApiCalories = exercise.calories_burned != null && exercise.calories_burned >= 0
  const refDur = hasApiDuration ? exercise.duration_minutes! : 30
  const met = Number(exercise.met_value)
  const caloriesDisplay = hasApiCalories
    ? exercise.calories_burned!
    : estimateCaloriesBurnedMet(refDur, Number.isFinite(met) && met > 0 ? met : 3, weightKg)
  const durationLabel = hasApiDuration ? formatDuration(exercise.duration_minutes) : `~${refDur} phút`
  const showEstimateHint = !hasApiDuration || !hasApiCalories

  return (
    <div
      role="link"
      tabIndex={0}
      className="rounded-xl bg-card border border-border p-5 hover:border-border-hover transition-all duration-200 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Dumbbell size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{exercise.name}</h3>
            <p className="text-xs text-muted">{exercise.category?.name ?? 'Chưa phân loại'}</p>
          </div>
        </div>
        {canEdit && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
                <MoreHorizontal size={14} />
              </Button>
            }
            items={[
              { label: 'Chỉnh sửa', icon: <Pencil size={12} />, onClick: onEdit },
              { label: 'Xóa',       icon: <Trash2 size={12} />, onClick: onDelete, danger: true },
            ]}
            align="right"
          />
          </div>
        )}
      </div>

      {exercise.description && (
        <p className="text-xs text-muted line-clamp-2 mb-3">{exercise.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={difficultyVariant[exercise.difficulty_level]}>
          {DIFFICULTY_LABELS[exercise.difficulty_level]}
        </Badge>
        {exercise.equipment && (
          <Badge variant="neutral">{exercise.equipment}</Badge>
        )}
        {exercise.muscleGroups?.slice(0, 2).map((mg) => (
          <Badge key={mg.id} variant="neutral">{mg.name}</Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted tabular-nums">
          <Clock size={13} className="shrink-0 opacity-80" aria-hidden />
          <span>{durationLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted tabular-nums">
          <Flame size={13} className="shrink-0 text-accent opacity-90" aria-hidden />
          <span>{formatCalories(caloriesDisplay)}</span>
        </span>
        {showEstimateHint && (
          <span className="text-[11px] text-subtle">Ước tính</span>
        )}
      </div>
    </div>
  )
}
