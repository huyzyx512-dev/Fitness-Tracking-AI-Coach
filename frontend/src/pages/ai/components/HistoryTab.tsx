import { useState } from 'react'
import { AlertCircle, CheckCircle2, History } from 'lucide-react'
import { useAiRecommendations } from '@/hooks/ai/useAiRecommendations'
import { useAiRecommendationDetail } from '@/hooks/ai/useAiRecommendationDetail'
import { useApplyAiRecommendation } from '@/hooks/ai/useApplyAiRecommendation'
import { getErrorMessage } from '@/lib/utils'
import type {
  AiGeneratedExercise,
  AiGeneratedPlan,
  AiWorkoutRecommendationSummary,
} from '@/types/ai.types'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'

const GOAL_LABELS: Record<string, string> = {
  general_fitness: 'Sức khỏe tổng quát',
  muscle_gain: 'Tăng cơ',
  fat_loss: 'Giảm mỡ',
  endurance: 'Sức bền',
  other: 'Khác',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Người mới',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN')
}

function formatGoal(goal: string): string {
  return GOAL_LABELS[goal] ?? goal
}

function formatLevel(level: string): string {
  return LEVEL_LABELS[level] ?? level
}

function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'warning'
    case 'applied':
      return 'success'
    case 'dismissed':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp'
    case 'applied':
      return 'Đã áp dụng'
    case 'dismissed':
      return 'Đã bỏ'
    default:
      return status
  }
}

function getDayIndexes(plan: AiGeneratedPlan): number[] {
  return plan.days.map((day) => day.dayIndex)
}

function formatExerciseSets(exercise: AiGeneratedExercise): string {
  const parts = [`${exercise.sets}×${exercise.reps}`]
  if (exercise.weight != null) parts.push(`${exercise.weight} kg`)
  if (exercise.restTimeSeconds != null) parts.push(`nghỉ ${exercise.restTimeSeconds}s`)
  return parts.join(' · ')
}

export function HistoryTab() {
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [applyResult, setApplyResult] = useState<{ message: string; workoutIds: number[] } | null>(
    null,
  )

  const recommendationsQuery = useAiRecommendations()
  const detailQuery = useAiRecommendationDetail(selectedRecommendationId)
  const applyAiRecommendation = useApplyAiRecommendation()

  const isListLoading = recommendationsQuery.isLoading || recommendationsQuery.isPending
  const recommendations = recommendationsQuery.data ?? []
  const detail = detailQuery.data
  const plan = detail?.generatedPlan
  const isApplying = applyAiRecommendation.isPending

  const selectedDayIndexes =
    plan && plan.days.length > 0 ? getDayIndexes(plan).filter((i) => i > 0) : []

  const canApply =
    Boolean(detail) &&
    detail!.status === 'draft' &&
    Boolean(plan) &&
    plan!.days.length > 0 &&
    selectedDayIndexes.length > 0 &&
    !isApplying

  function openDetail(id: number) {
    setApplyResult(null)
    setSelectedRecommendationId(id)
    setIsDetailOpen(true)
  }

  function closeDetail() {
    setIsDetailOpen(false)
    setSelectedRecommendationId(null)
    setApplyResult(null)
  }

  function handleApply() {
    if (!canApply || !detail || !plan) return

    applyAiRecommendation.mutate(
      {
        id: detail.id,
        payload: {
          selectedDayIndexes: getDayIndexes(plan),
          editedPlan: plan,
        },
      },
      {
        onSuccess: (data) => {
          if (detail.id === selectedRecommendationId) {
            setApplyResult({ message: data.message, workoutIds: data.workoutIds })
          }
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      {isListLoading && (
        <div className="space-y-4" role="status" aria-live="polite">
          <p className="text-sm text-muted">Đang tải lịch sử AI...</p>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {recommendationsQuery.isError && (
        <ErrorState
          error={recommendationsQuery.error}
          onRetry={() => recommendationsQuery.refetch()}
        />
      )}

      {!isListLoading && !recommendationsQuery.isError && recommendations.length === 0 && (
        <EmptyState
          icon={<History size={28} />}
          title="Chưa có kế hoạch AI nào"
          description="Hãy tạo kế hoạch ở tab Generate Plan để xem lại tại đây."
        />
      )}

      {!isListLoading && !recommendationsQuery.isError && recommendations.length > 0 && (
        <ul className="space-y-4">
          {recommendations.map((item) => (
            <li key={item.id}>
              <RecommendationListCard item={item} onViewDetail={() => openDetail(item.id)} />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={isDetailOpen}
        onClose={closeDetail}
        title="Chi tiết kế hoạch AI"
        size="xl"
        footer={
          detail && (
            <Button
              type="button"
              onClick={handleApply}
              loading={isApplying}
              disabled={!canApply}
            >
              {isApplying ? 'Đang áp dụng...' : 'Áp dụng kế hoạch'}
            </Button>
          )
        }
      >
        {detailQuery.isLoading || detailQuery.isPending ? (
          <p className="text-sm text-muted" role="status">
            Đang tải chi tiết...
          </p>
        ) : null}

        {detailQuery.isError && (
          <Card className="border-danger/40 bg-danger-bg/20">
            <CardBody>
              <div className="flex gap-3 items-start">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm text-danger" role="alert">
                  {getErrorMessage(detailQuery.error)}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {detail && plan && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <Card>
              <CardHeader className="pb-3 mb-0 border-b-0">
                <CardTitle>Tóm tắt</CardTitle>
              </CardHeader>
              <CardBody className="pt-0 space-y-2 text-sm">
                {plan.summary && (
                  <p className="text-foreground leading-relaxed">{plan.summary}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(detail.status)}>
                    {getStatusLabel(detail.status)}
                  </Badge>
                </div>
                <p className="text-muted">
                  Mục tiêu: {formatGoal(String(plan.goal))}
                  {' · '}
                  {plan.daysPerWeek} buổi/tuần · {plan.sessionMinutes} phút/buổi ·{' '}
                  {formatLevel(String(plan.level))}
                </p>
                <p className="text-xs text-muted">
                  Tạo lúc: {formatDateTime(detail.createdAt)}
                  {detail.appliedAt ? ` · Áp dụng: ${formatDateTime(detail.appliedAt)}` : ''}
                </p>
              </CardBody>
            </Card>

            {plan.days.map((day) => (
              <Card key={day.dayIndex}>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ngày {day.dayIndex}: {day.title}
                    </p>
                    {day.focus && <p className="text-xs text-muted mt-0.5">{day.focus}</p>}
                    <p className="text-xs text-muted mt-1">
                      {[
                        day.estimatedMinutes != null ? `~${day.estimatedMinutes} phút` : null,
                        `${day.exercises.length} bài tập`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <li
                        key={`${day.dayIndex}-${exerciseIndex}-${exercise.name}`}
                        className="rounded-xl border border-border/60 bg-surface/30 p-4 space-y-2"
                      >
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
                        <p className="text-sm text-foreground">{formatExerciseSets(exercise)}</p>
                        {exercise.notes && (
                          <p className="text-xs text-muted">{exercise.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}

            {plan.days.length === 0 && (
              <p className="text-xs text-warning" role="status">
                Kế hoạch không có ngày tập — không thể áp dụng.
              </p>
            )}

            {detail.status !== 'draft' && (
              <p className="text-xs text-muted" role="status">
                Chỉ kế hoạch ở trạng thái nháp mới có thể áp dụng.
              </p>
            )}

            {applyAiRecommendation.isError && (
              <Card className="border-danger/40 bg-danger-bg/20">
                <CardBody>
                  <div className="flex gap-3 items-start">
                    <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
                    <p className="text-sm text-danger" role="alert">
                      {getErrorMessage(applyAiRecommendation.error)}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {applyResult && (
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

        {detail && !plan && (
          <p className="text-sm text-muted" role="status">
            Không có dữ liệu kế hoạch chi tiết.
          </p>
        )}
      </Modal>
    </div>
  )
}

function RecommendationListCard({
  item,
  onViewDetail,
}: {
  item: AiWorkoutRecommendationSummary
  onViewDetail: () => void
}) {
  const isDraft = item.status === 'draft'

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{formatGoal(String(item.goal))}</p>
            <p className="text-sm text-muted">
              {item.daysPerWeek} buổi/tuần · {item.sessionMinutes} phút/buổi ·{' '}
              {formatLevel(String(item.level))}
            </p>
            <p className="text-xs text-muted">{formatDateTime(item.createdAt)}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(item.status)}>{getStatusLabel(item.status)}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onViewDetail}>
            Xem chi tiết
          </Button>
          {isDraft && (
            <Button type="button" size="sm" onClick={onViewDetail}>
              Áp dụng
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
