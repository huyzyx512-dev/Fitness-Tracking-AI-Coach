import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Activity, MoreHorizontal, Pencil, Trash2, Dumbbell } from 'lucide-react'
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
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: exercises, isLoading, error, refetch } = useExerciseList()
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

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises
      .filter((e) => !search     || e.name.toLowerCase().includes(search.toLowerCase()))
      .filter((e) => !catFilter  || String(e.category_id) === catFilter)
      .filter((e) => !diffFilter || e.difficulty_level === diffFilter)
  }, [exercises, search, catFilter, diffFilter])

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
              canEdit={isAdmin || ex.created_by === user?.id}
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
  exercise, canEdit, onEdit, onDelete,
}: { exercise: Exercise; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl bg-card border border-border p-5 hover:border-border-hover transition-all duration-200 group">
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
    </div>
  )
}
