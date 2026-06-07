import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, LogOut, ScrollText, ShieldCheck, Unlock, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { GENDER_LABELS, ROUTES } from '@/lib/constants'
import { cn, formatDate, formatDatetime } from '@/lib/utils'
import { useAdminUserAuditLogs } from '@/hooks/user/useAdminUserAuditLogs'
import { useAdminUserDetail } from '@/hooks/user/useAdminUserDetail'
import { useForceLogoutAdminUser } from '@/hooks/user/useForceLogoutAdminUser'
import { useResetAdminUserPassword } from '@/hooks/user/useResetAdminUserPassword'
import { useUpdateAdminUserRole } from '@/hooks/user/useUpdateAdminUserRole'
import { useUpdateAdminUserStatus } from '@/hooks/user/useUpdateAdminUserStatus'
import { useAuthStore } from '@/store/auth.store'
import type { AdminAuditAction, AdminAuditLogEntry } from '@/types/admin-user.types'
import type { AdminUser, AdminUserStatus } from '@/types/admin-user.types'
import type { Role } from '@/types/auth.types'
import { needsDoubleRoleConfirm } from './adminUserGovernance'
import { AdminUserGovernanceModals, type RoleChangeIntent } from './AdminUserGovernanceModals'

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  USER_STATUS_CHANGED: 'Thay đổi trạng thái tài khoản',
  USER_ROLE_CHANGED: 'Thay đổi vai trò',
  USER_PASSWORD_RESET: 'Đặt lại mật khẩu',
  USER_CREATED: 'Tạo tài khoản',
  USER_LOGIN: 'Đăng nhập',
  USER_FORCE_LOGOUT: 'Buộc đăng xuất',
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
    case 'USER_LOGIN': {
      const ipAddress = typeof m.ipAddress === 'string' ? m.ipAddress : ''
      const userAgent = typeof m.userAgent === 'string' ? m.userAgent : ''
      if (ipAddress && userAgent) return `IP: ${ipAddress} • Thiết bị: ${userAgent}`
      if (ipAddress) return `IP: ${ipAddress}`
      if (userAgent) return `Thiết bị: ${userAgent}`
      return 'Đăng nhập thành công'
    }
    case 'USER_FORCE_LOGOUT':
      return 'Đã thu hồi tất cả phiên đăng nhập'
    default:
      return ''
  }
}

export default function AdminUserDetailPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { id } = useParams<{ id: string }>()
  const userId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }, [id])

  const [auditPage, setAuditPage] = useState(1)
  const [auditLimit] = useState(10)

  const [statusIntent, setStatusIntent] = useState<{ user: AdminUser; next: AdminUserStatus } | null>(null)
  const [roleIntent, setRoleIntent] = useState<RoleChangeIntent | null>(null)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [forceLogoutUser, setForceLogoutUser] = useState<AdminUser | null>(null)
  const [forceLogoutPassword, setForceLogoutPassword] = useState('')
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string
    userLabel: string
    email: string
  } | null>(null)

  const detailQuery = useAdminUserDetail(userId)
  const auditQuery = useAdminUserAuditLogs(userId, auditPage, auditLimit)

  const updateStatus = useUpdateAdminUserStatus()
  const updateRole = useUpdateAdminUserRole()
  const resetPassword = useResetAdminUserPassword()
  const forceLogout = useForceLogoutAdminUser()

  const user = detailQuery.data?.user
  const logs = auditQuery.data?.logs ?? []
  const isSelf = user != null && currentUserId != null && user.id === currentUserId

  function openRoleChange(target: AdminUser, nextRole: Role['name']) {
    const step = needsDoubleRoleConfirm(target.role?.name, nextRole) ? 1 : 2
    setRoleIntent({ user: target, nextRole, step })
  }

  function handleRoleConfirm(adminPassword?: string) {
    if (!roleIntent) return
    const { user: target, nextRole, step } = roleIntent
    if (needsDoubleRoleConfirm(target.role?.name, nextRole) && step === 1) {
      setRoleIntent({ user: target, nextRole, step: 2 })
      return
    }
    const pwd = adminPassword?.trim()
    if (!pwd) return
    updateRole.mutate(
      { id: target.id, role: nextRole, adminPassword: pwd },
      { onSettled: () => setRoleIntent(null) },
    )
  }

  function handleStatusConfirm(adminPassword: string) {
    if (!statusIntent) return
    const pwd = adminPassword.trim()
    if (!pwd) return
    updateStatus.mutate(
      { id: statusIntent.user.id, status: statusIntent.next, adminPassword: pwd },
      { onSettled: () => setStatusIntent(null) },
    )
  }

  function handleResetConfirm(adminPassword: string) {
    if (!resetUser) return
    const pwd = adminPassword.trim()
    if (!pwd) return
    resetPassword.mutate(
      { id: resetUser.id, adminPassword: pwd },
      {
        onSuccess: (res) => {
          setResetUser(null)
          setResetResult({
            temporaryPassword: res.temporaryPassword,
            userLabel: res.user.name || res.user.email,
            email: res.user.email,
          })
        },
      },
    )
  }

  function handleConfirmForceLogout() {
    if (!forceLogoutUser) return
    const pwd = forceLogoutPassword.trim()
    if (!pwd) return
    forceLogout.mutate(
      { id: forceLogoutUser.id, adminPassword: pwd },
      {
        onSuccess: () => {
          setForceLogoutUser(null)
          setForceLogoutPassword('')
        },
      },
    )
  }

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

  if (detailQuery.error) {
    return <ErrorState error={detailQuery.error} onRetry={detailQuery.refetch} />
  }

  if (auditQuery.error) {
    return <ErrorState error={auditQuery.error} onRetry={auditQuery.refetch} />
  }

  const auditPagination = auditQuery.data?.pagination

  return (
    <section className="space-y-6 animate-fade-up">
      <AdminUserGovernanceModals
        statusIntent={statusIntent}
        onCloseStatus={() => setStatusIntent(null)}
        onConfirmStatus={handleStatusConfirm}
        statusLoading={updateStatus.isPending}
        roleIntent={roleIntent}
        onCloseRole={() => setRoleIntent(null)}
        onConfirmRole={handleRoleConfirm}
        roleLoading={updateRole.isPending}
        resetUser={resetUser}
        onCloseReset={() => setResetUser(null)}
        onConfirmReset={handleResetConfirm}
        resetLoading={resetPassword.isPending}
        resetResult={resetResult}
        onCloseResetResult={() => setResetResult(null)}
      />
      <ConfirmModal
        open={forceLogoutUser !== null}
        onClose={() => {
          setForceLogoutUser(null)
          setForceLogoutPassword('')
        }}
        onConfirm={handleConfirmForceLogout}
        title="Buộc đăng xuất?"
        description={
          forceLogoutUser
            ? `Tất cả phiên đăng nhập của ${forceLogoutUser.name || forceLogoutUser.email} sẽ bị thu hồi ngay lập tức.`
            : ''
        }
        extra={
          <Input
            type="password"
            label="Mật khẩu quản trị của bạn"
            autoComplete="current-password"
            value={forceLogoutPassword}
            onChange={(e) => setForceLogoutPassword(e.target.value)}
            required
          />
        }
        confirmLabel="Buộc đăng xuất"
        confirmDisabled={!forceLogoutPassword.trim()}
        variant="danger"
        isLoading={forceLogout.isPending}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="CHI TIẾT NGƯỜI DÙNG"
          description="Hồ sơ tài khoản, hành động quản trị và lịch sử thao tác."
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

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {detailQuery.isLoading ? 'Đang tải...' : (user?.name || 'Chưa cập nhật tên')}
            </h2>
            <p className="text-sm text-muted mt-1">{user?.email || `Người dùng #${userId}`}</p>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant={user.role?.name === 'ADMIN' ? 'accent' : 'info'}>
                {user.role?.name || 'UNKNOWN'}
              </Badge>
              <Badge variant={user.status === 'active' ? 'success' : 'danger'} dot>
                {user.status === 'active' ? 'Đang hoạt động' : 'Đang khóa'}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileItem label="Ngày tạo" value={formatDatetime(user?.createdAt)} />
          <ProfileItem label="Đăng nhập gần nhất" value={formatDatetime(user?.lastLoginAt)} />
          <ProfileItem label="Cân nặng" value={user?.weight != null ? `${user.weight} kg` : '—'} />
          <ProfileItem label="Chiều cao" value={user?.height != null ? `${user.height} cm` : '—'} />
          <ProfileItem label="Giới tính" value={user?.gender ? GENDER_LABELS[user.gender] : '—'} />
          <ProfileItem label="Ngày sinh" value={formatDate(user?.date_of_birth)} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Hành động quản trị</h2>
          <p className="text-sm text-muted mt-1">Khóa/mở khóa, đổi vai trò, reset mật khẩu và buộc đăng xuất.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={user?.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
            disabled={!user || isSelf}
            onClick={() => {
              if (!user) return
              setStatusIntent({
                user,
                next: user.status === 'active' ? 'locked' : 'active',
              })
            }}
          >
            {user?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<KeyRound size={14} />}
            disabled={!user || isSelf}
            onClick={() => user && setResetUser(user)}
          >
            Đặt lại mật khẩu
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<LogOut size={14} />}
            disabled={!user || isSelf}
            onClick={() => user && setForceLogoutUser(user)}
          >
            Buộc đăng xuất
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserCog size={14} />}
            disabled={!user || isSelf || user.role?.name === 'USER'}
            onClick={() => user && openRoleChange(user, 'USER')}
          >
            Đổi sang USER
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserCog size={14} />}
            disabled={!user || isSelf || user.role?.name === 'COACH'}
            onClick={() => user && openRoleChange(user, 'COACH')}
          >
            Đổi sang COACH
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            disabled={!user || isSelf || user.role?.name === 'ADMIN'}
            onClick={() => user && openRoleChange(user, 'ADMIN')}
          >
            Đổi sang ADMIN
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-raised text-accent">
            <ScrollText size={18} aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Nhật ký quản trị</h2>
            <p className="text-sm text-muted">Theo dõi thao tác gần nhất theo từng trang.</p>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {auditQuery.isLoading && (
            <li className="px-6 py-10 text-center text-sm text-muted">Đang tải…</li>
          )}
          {!auditQuery.isLoading && logs.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-muted">
              Chưa có thao tác quản trị được ghi nhận cho tài khoản này.
            </li>
          )}
          {!auditQuery.isLoading &&
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
        <div className="border-t border-border px-6 py-4">
          <Pagination
            page={auditPagination?.page ?? auditPage}
            limit={auditPagination?.limit ?? auditLimit}
            total={auditPagination?.total ?? 0}
            onChange={setAuditPage}
          />
        </div>
      </Card>
    </section>
  )
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-raised/40 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  )
}
