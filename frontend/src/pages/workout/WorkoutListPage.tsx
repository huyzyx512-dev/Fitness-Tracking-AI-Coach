import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Dumbbell, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { Table }         from '@/components/ui/Table'
import { SearchInput }   from '@/components/ui/SearchInput'
import { ConfirmModal }  from '@/components/ui/ConfirmModal'
import { Dropdown }      from '@/components/ui/Dropdown'
import { ErrorState }    from '@/components/ui/ErrorState'
import { useWorkoutList }   from '@/hooks/workout/useWorkoutList'
import { useDeleteWorkout } from '@/hooks/workout/useDeleteWorkout'
import { ROUTES, WORKOUT_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatDuration, computeWorkoutExerciseEnergyRows } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Column } from '@/components/ui/Table'
import type { Workout } from '@/types/workout.types'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusVariant: Record<string, BadgeVariant> = {
  pending: 'neutral', in_progress: 'info', completed: 'success',
}

const STATUS_TABS = [
  { value: 'all',         label: 'Tất cả' },
  { value: 'pending',     label: 'Chờ tập' },
  { value: 'in_progress', label: 'Đang tập' },
  { value: 'completed',   label: 'Hoàn thành' },
]

export default function WorkoutListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [search,    setSearch]    = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [deleteId,  setDeleteId]  = useState<number | null>(null)

  const { data: workouts, isLoading, error, refetch } = useWorkoutList()
  const deleteMutation = useDeleteWorkout()

  const filtered = useMemo(() => {
    if (!workouts) return []
    return workouts
      .filter((w) => statusTab === 'all' || w.status === statusTab)
      .filter((w) => !search || w.title.toLowerCase().includes(search.toLowerCase()))
  }, [workouts, search, statusTab])

  const columns: Column<Workout>[] = [
    {
      key: 'title', header: 'Buổi tập',
      render: (w) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Dumbbell size={14} className="text-accent" />
          </div>
          <div>
            <p className="font-medium text-foreground">{w.title}</p>
            {w.notes && <p className="text-xs text-muted truncate max-w-[200px]">{w.notes}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Trạng thái', sortable: true,
      render: (w) => (
        <Badge variant={statusVariant[w.status]} dot>
          {WORKOUT_STATUS_LABELS[w.status]}
        </Badge>
      ),
    },
    {
      key: 'exercises', header: 'Bài tập',
      render: (w) => <span className="text-muted">{w.exercises?.length ?? 0} bài</span>,
    },
    {
      key: 'scheduled_at', header: 'Lịch tập', sortable: true,
      render: (w) => <span className="text-muted text-sm">{formatDate(w.scheduled_at)}</span>,
    },
    {
      key: 'log',
      header: 'Thời lượng',
      render: (w) => {
        const energy = computeWorkoutExerciseEnergyRows(
          w.exercises ?? [],
          w.log ?? null,
          user?.weight ?? 70,
        )
        if (energy.totalDurationMinutes <= 0) {
          return <span className="text-muted text-sm">—</span>
        }
        return (
          <span className="text-muted text-sm">
            <span className="tabular-nums">{formatDuration(energy.totalDurationMinutes)}</span>
            {!energy.isActualTotals && (
              <span className="block text-[10px] text-subtle leading-tight mt-0.5">Ước tính</span>
            )}
          </span>
        )
      },
    },
    {
      key: 'actions', header: '', className: 'w-12 text-right',
      render: (w) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="icon" aria-label="Hành động">
              <MoreHorizontal size={15} />
            </Button>
          }
          items={[
            { label: 'Xem chi tiết', icon: <Eye size={13} />,    onClick: () => navigate(ROUTES.WORKOUT_DETAIL(w.id)) },
            { label: 'Chỉnh sửa',   icon: <Pencil size={13} />, onClick: () => navigate(ROUTES.WORKOUT_EDIT(w.id)), disabled: w.status === 'completed' },
            { label: 'Xóa',         icon: <Trash2 size={13} />, onClick: () => setDeleteId(w.id), danger: true, divider: true },
          ]}
          align="right"
        />
      ),
    },
  ]

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="BUỔI TẬP"
        description="Quản lý và theo dõi các buổi luyện tập của bạn"
        action={
          <Button leftIcon={<Plus size={15} />} onClick={() => navigate(ROUTES.WORKOUT_NEW)}>
            Tạo buổi tập
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên buổi tập..."
          className="w-full sm:w-72"
        />

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusTab === tab.value
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground hover:bg-card-raised'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(w) => w.id}
          isLoading={isLoading}
          onRowClick={(w) => navigate(ROUTES.WORKOUT_DETAIL(w.id))}
          emptyTitle="Chưa có buổi tập"
          emptyDesc="Tạo buổi tập đầu tiên để bắt đầu luyện tập"
          emptyIcon={<Dumbbell size={24} />}
          emptyAction={{ label: 'Tạo buổi tập', onClick: () => navigate(ROUTES.WORKOUT_NEW) }}
        />
      </div>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null) }}
        title="Xóa buổi tập?"
        description="Hành động này không thể hoàn tác. Toàn bộ dữ liệu liên quan sẽ bị xóa."
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
