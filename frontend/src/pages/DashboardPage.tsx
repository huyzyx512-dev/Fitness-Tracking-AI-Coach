import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, CheckCircle2, Clock, Flame, Plus, ArrowRight, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useWorkoutList } from '@/hooks/workout/useWorkoutList'
import { useWorkoutLogList } from '@/hooks/workoutLog/useWorkoutLogList'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES, WORKOUT_STATUS, WORKOUT_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatDuration, formatCalories } from '@/lib/utils'
import type { BadgeVariant } from '@/components/ui/Badge'

const statusVariant: Record<string, BadgeVariant> = {
  pending:     'neutral',
  in_progress: 'info',
  completed:   'success',
}

export default function DashboardPage() {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: workouts, isLoading: wLoading, error: wError, refetch: wRefetch } = useWorkoutList()
  const { data: logs,     isLoading: lLoading } = useWorkoutLogList()

  const stats = useMemo(() => {
    const total     = workouts?.length ?? 0
    const completed = workouts?.filter((w) => w.status === WORKOUT_STATUS.COMPLETED).length ?? 0
    const active    = workouts?.filter((w) => w.status === WORKOUT_STATUS.IN_PROGRESS).length ?? 0
    const totalCal  = logs?.reduce((sum, l) => sum + (l.calories_burned ?? 0), 0) ?? 0
    return { total, completed, active, totalCal }
  }, [workouts, logs])

  const recentWorkouts = useMemo(
    () => [...(workouts ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).slice(0, 5),
    [workouts],
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  if (wError) return <ErrorState error={wError} onRetry={wRefetch} />

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ').pop() ?? 'bạn'}!`}
        description="Hãy duy trì phong độ và tiếp tục chuỗi luyện tập hôm nay."
        action={
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => navigate(ROUTES.WORKOUT_NEW)}
          >
            Tạo buổi tập
          </Button>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard
          icon={<Dumbbell size={20} />}
          label="Tổng buổi tập"
          value={stats.total}
          color="accent"
          loading={wLoading}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Đã hoàn thành"
          value={stats.completed}
          color="success"
          loading={wLoading}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Đang tập"
          value={stats.active}
          color="info"
          loading={wLoading}
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Tổng calo"
          value={formatCalories(stats.totalCal)}
          color="warning"
          loading={lLoading}
        />
      </div>

      {/* Recent workouts */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Buổi tập gần đây</h2>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight size={13} />}
            onClick={() => navigate(ROUTES.WORKOUTS)}
          >
            Xem tất cả
          </Button>
        </div>

        {wLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-16" />)}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-4">
            <CalendarDays size={32} className="text-muted mb-3" />
            <p className="text-sm text-foreground font-medium">Chưa có buổi tập nào</p>
            <p className="text-xs text-muted mt-1 mb-4">Hãy tạo buổi tập đầu tiên của bạn</p>
            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => navigate(ROUTES.WORKOUT_NEW)}>
              Tạo ngay
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {recentWorkouts.map((workout) => (
              <li
                key={workout.id}
                onClick={() => navigate(ROUTES.WORKOUT_DETAIL(workout.id))}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-card/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                      {workout.title}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(workout.scheduled_at ?? workout.createdAt)}
                      {workout.exercises.length > 0 && ` · ${workout.exercises.length} bài tập`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {workout.log && (
                    <span className="text-xs text-muted hidden sm:block">
                      {formatDuration(workout.log.duration_minutes)}
                    </span>
                  )}
                  <Badge variant={statusVariant[workout.status]} dot>
                    {WORKOUT_STATUS_LABELS[workout.status]}
                  </Badge>
                  <ArrowRight size={14} className="text-subtle group-hover:text-muted transition-colors" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────────── */
interface StatCardProps {
  icon:    React.ReactNode
  label:   string
  value:   string | number
  color:   'accent' | 'success' | 'info' | 'warning'
  loading: boolean
}

const colorMap = {
  accent:  { bg: 'bg-accent/10',   text: 'text-accent' },
  success: { bg: 'bg-success-bg',  text: 'text-success' },
  info:    { bg: 'bg-info-bg',     text: 'text-info' },
  warning: { bg: 'bg-warning-bg',  text: 'text-warning' },
}

function StatCard({ icon, label, value, color, loading }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className="flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        {loading ? (
          <div className="h-6 w-16 rounded bg-card-raised animate-pulse mt-0.5" />
        ) : (
          <p className="text-xl font-semibold text-foreground leading-tight">{value}</p>
        )}
      </div>
    </Card>
  )
}
