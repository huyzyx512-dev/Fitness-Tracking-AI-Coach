import { Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { DIFFICULTY_LABELS } from '@/lib/constants'
import type { Exercise } from '@/types/exercise.types'
import type { BadgeVariant } from '@/components/ui/Badge'

const difficultyVariant: Record<string, BadgeVariant> = {
  'cơ bản':     'success',
  'trung bình': 'warning',
  'nâng cao':   'danger',
}

export interface ExercisePickerCardProps {
  exercise:  Exercise
  disabled?: boolean
  onPick:    (exercise: Exercise) => void
  className?: string
}

export function ExercisePickerCard({
  exercise,
  disabled = false,
  onPick,
  className,
}: ExercisePickerCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(exercise)}
      className={cn(
        'w-full text-left rounded-xl bg-card border border-border p-4',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-border-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:border-border',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0',
            disabled && 'opacity-70',
          )}
        >
          <Dumbbell size={16} className="text-accent" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{exercise.name}</h3>
              <p className="text-xs text-muted truncate">{exercise.category?.name ?? 'Chưa phân loại'}</p>
            </div>
            {disabled && (
              <Badge variant="neutral" className="shrink-0">
                Đã thêm
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={difficultyVariant[exercise.difficulty_level]}>
              {DIFFICULTY_LABELS[exercise.difficulty_level]}
            </Badge>
            {exercise.equipment ? (
              <Badge variant="neutral">{exercise.equipment}</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}
