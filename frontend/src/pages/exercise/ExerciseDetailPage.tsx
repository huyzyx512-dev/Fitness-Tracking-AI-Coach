import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Dumbbell, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { useExercise } from '@/hooks/exercise/useExercise'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES, DIFFICULTY_LABELS, ROLE } from '@/lib/constants'
import type { BadgeVariant } from '@/components/ui/Badge'

const difficultyVariant: Record<string, BadgeVariant> = {
  'cơ bản': 'success',
  'trung bình': 'warning',
  'nâng cao': 'danger',
}

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`
}

function extractYoutubeVideoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1]
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]
    }
  } catch {
    return null
  }
  return null
}

function isYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname.includes('youtube.com') || u.hostname === 'youtu.be'
  } catch {
    return false
  }
}

export default function ExerciseDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role?.name === ROLE.ADMIN

  const id = Number(idParam)
  const invalidId = !Number.isInteger(id) || id <= 0

  const { data: exercise, isLoading, error, refetch } = useExercise(invalidId ? undefined : id)

  if (invalidId) {
    return <ErrorState message="Mã bài tập không hợp lệ" />
  }

  if (isLoading) return <FullPageSpinner />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!exercise) return <ErrorState message="Không tìm thấy bài tập" />

  const canEdit = isAdmin || exercise.created_by === user?.id
  const videoSrc = resolveMediaUrl(exercise.video_url)
  const thumbSrc = resolveMediaUrl(exercise.thumbnail_url)

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <PageHeader
        title={exercise.name.toUpperCase()}
        description={exercise.category?.name ?? undefined}
        action={
          canEdit ? (
            <Button
              variant="secondary"
              leftIcon={<Pencil size={14} />}
              onClick={() => navigate(`${ROUTES.EXERCISES}/${exercise.id}/edit`)}
            >
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={difficultyVariant[exercise.difficulty_level]}>
          {DIFFICULTY_LABELS[exercise.difficulty_level]}
        </Badge>
        {exercise.equipment && <Badge variant="neutral">{exercise.equipment}</Badge>}
      </div>

      {exercise.description && (
        <section className="rounded-xl bg-card border border-border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Mô tả</h2>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{exercise.description}</p>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted mb-1">MET</p>
          <p className="text-lg font-semibold tabular-nums">{exercise.met_value}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 sm:col-span-2">
          <p className="text-xs text-muted mb-1 flex items-center gap-1.5">
            <User size={12} aria-hidden /> Người tạo
          </p>
          <p className="text-sm font-medium truncate">{exercise.creator?.name ?? `ID ${exercise.created_by}`}</p>
        </div>
      </div>

      {exercise.muscleGroups.length > 0 && (
        <section className="rounded-xl bg-card border border-border p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
            <Dumbbell size={14} className="text-accent" aria-hidden /> Nhóm cơ
          </h2>
          <div className="flex flex-wrap gap-2">
            {exercise.muscleGroups.map((mg) => (
              <Badge key={mg.id} variant={mg.ExerciseMuscle?.is_primary ? 'info' : 'neutral'}>
                {mg.name}
                {mg.ExerciseMuscle?.is_primary ? ' · Chính' : ''}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {(thumbSrc || videoSrc) && (
        <section className="rounded-xl bg-card border border-border overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted px-5 pt-5 pb-2">
            Video hướng dẫn
          </h2>
          <div className="px-5 pb-5 space-y-4">
            {thumbSrc && !videoSrc && (
              <img src={thumbSrc} alt={`Ảnh minh họa — ${exercise.name}`} className="w-full rounded-lg object-cover aspect-video bg-muted/30" />
            )}
            {videoSrc &&
              (isYoutubeUrl(videoSrc) ? (
                (() => {
                  const vid = extractYoutubeVideoId(videoSrc)
                  return vid ? (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted/30">
                      <iframe
                        title={`Video — ${exercise.name}`}
                        src={`https://www.youtube-nocookie.com/embed/${vid}`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Không nhúng được liên kết YouTube này.</p>
                  )
                })()
              ) : (
                <video controls className="w-full rounded-lg aspect-video bg-black" src={videoSrc}>
                  Trình duyệt không hỗ trợ phát video.
                </video>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}
