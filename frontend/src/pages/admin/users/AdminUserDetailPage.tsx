import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { ROUTES } from '@/lib/constants'
import { cn, formatDatetime } from '@/lib/utils'
import { useAdminUserAuditLogs } from '@/hooks/user/useAdminUserAuditLogs'
import type { AdminAuditAction, AdminAuditLogEntry } from '@/types/admin-user.types'

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  USER_STATUS_CHANGED: 'Thay đổi trạng thái tài khoản',
  USER_ROLE_CHANGED: 'Thay đổi vai trò',
  USER_PASSWORD_RESET: 'Đặt lại mật khẩu',
  USER_CREATED: 'Tạo tài khoản',
}

function isAuditAction(value: string): value is AdminAuditAction {
  return value in ACTION_LABELS
}

function describeMetadata(entry: AdminAuditLogEntry): string {
  if (!isAuditAction(entry.action)) return ''
  const m = entry.metadata
  if (!m || typeof m !== 'object') return ''
  switch (entry.action) {
    case 'USER_STATUS_CHANGED': {
      const prev = typeof m.previousStatus === 'string' ? m.previousStatus : ''
      const next = typeof m.nextStatus === 'string' ? m.nextStatus : ''
      if (prev && next) return `${prev} → ${next}`
      return ''
    }
    case 'USER_ROLE_CHANGED': {
      const prev = typeof m.previousRole === 'string' ? m.previousRole : ''
      const next = typeof m.nextRole === 'string' ? m.nextRole : ''
      if (prev && next) return `${prev} → ${next}`
      return ''
    }
    case 'USER_PASSWORD_RESET':
      return 'Thu hồi phiên đăng nhập'
    case 'USER_CREATED': {
      const r = typeof m.assignedRole === 'string' ? m.assignedRole : ''
      return r ? `Vai trò: ${r}` : ''
    }
    default:
      return ''
  }
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }, [id])

  const { data, isLoading, error, refetch } = useAdminUserAuditLogs(userId)

  if (userId == null) {
    return (
      <section className="space-y-6 animate-fade-up">
        <PageHeader title="CHI TIẾT NGƯỜI DÙNG" description="ID không hợp lệ." />
        <Card className="p-6">
          <p className="text-sm text-muted">Vui lòng quay lại danh sách và chọn một người dùng.</p>
          <Link
            to={ROUTES.ADMIN_USERS}
            className={cn(
              'mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium',
              'border border-border bg-card-raised text-foreground hover:bg-card-raised/70',
              'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            )}
          >
            Về danh sách
          </Link>
        </Card>
      </section>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  const logs = data?.logs ?? []

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="CHI TIẾT NGƯỜI DÙNG"
          description="Nhật ký thao tác quản trị lên tài khoản này (khóa/mở khóa, vai trò, đặt lại mật khẩu)."
        />
        <Link
          to={ROUTES.ADMIN_USERS}
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-foreground',
            'hover:bg-card transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <ArrowLeft size={16} aria-hidden />
          Danh sách
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-raised text-accent">
            <ScrollText size={18} aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Nhật ký quản trị</h2>
            <p className="text-sm text-muted">Người dùng #{userId}</p>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {isLoading && (
            <li className="px-6 py-10 text-center text-sm text-muted">Đang tải…</li>
          )}
          {!isLoading && logs.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-muted">
              Chưa có thao tác quản trị được ghi nhận cho tài khoản này.
            </li>
          )}
          {!isLoading &&
            logs.map((entry) => {
              const label = isAuditAction(entry.action)
                ? ACTION_LABELS[entry.action]
                : entry.action
              const metaLine = describeMetadata(entry)
              const actorLabel =
                entry.actor?.name?.trim() || entry.actor?.email || `Quản trị viên #${entry.actor?.id ?? '?'}`

              return (
                <li key={entry.id} className="px-6 py-4 hover:bg-card-raised/60 transition-colors duration-150">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="font-medium text-foreground">{label}</p>
                    <time className="text-xs text-muted tabular-nums shrink-0" dateTime={entry.createdAt}>
                      {formatDatetime(entry.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    Thực hiện: <span className="text-foreground/90">{actorLabel}</span>
                  </p>
                  {metaLine ? (
                    <p className="text-sm text-muted mt-0.5">{metaLine}</p>
                  ) : null}
                </li>
              )
            })}
        </ul>
      </Card>
    </section>
  )
}
