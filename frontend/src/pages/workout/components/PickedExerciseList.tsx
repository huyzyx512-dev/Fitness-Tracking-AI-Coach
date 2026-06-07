import { Pencil, Trash2, Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/exercise.types'

/** Row stored client-side when building a workout before submit */
export type PickedExerciseItem = {
  exercise:            Exercise
  sets:                number
  reps:                number
  weight:              number
  rest_time_seconds:   number
  comment:             string
}

export interface PickedExerciseListProps {
  items:       PickedExerciseItem[]
  onEdit:      (index: number) => void
  onRemove:    (index: number) => void
  className?:  string
}

export function PickedExerciseList({
  items,
  onEdit,
  onRemove,
  className,
}: PickedExerciseListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Dumbbell size={24} />}
        title="Chưa có bài tập"
        description="Chọn bài ở cột bên phải để thêm vào buổi tập."
        className={cn('border border-dashed border-border rounded-xl bg-card/50 py-10', className)}
      />
    )
  }

  return (
    <ul className={cn('space-y-3', className)} role="list">
      {items.map((row, idx) => (
        <li
          key={`${row.exercise.id}-${idx}`}
          className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground truncate">{row.exercise.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">
                {row.sets} × {row.reps}
              </Badge>
              <Badge variant="neutral">Nghỉ {row.rest_time_seconds}s</Badge>
              {row.weight > 0 ? (
                <Badge variant="neutral">{row.weight} kg</Badge>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Pencil size={14} />}
              aria-label={`Sửa ${row.exercise.name}`}
              onClick={() => onEdit(idx)}
            >
              Sửa
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger hover:bg-danger/10"
              leftIcon={<Trash2 size={14} />}
              aria-label={`Xóa ${row.exercise.name}`}
              onClick={() => onRemove(idx)}
            >
              Xóa
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
