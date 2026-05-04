import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AdminUser, AdminUserStatus } from '@/types/admin-user.types'
import type { Role } from '@/types/auth.types'
import { needsDoubleRoleConfirm } from './adminUserGovernance'

export type RoleChangeIntent = {
  user: AdminUser
  nextRole: Role['name']
  step: 1 | 2
}

type AdminUserGovernanceModalsProps = {
  statusIntent: { user: AdminUser; next: AdminUserStatus } | null
  onCloseStatus: () => void
  onConfirmStatus: (adminPassword: string) => void
  statusLoading: boolean

  roleIntent: RoleChangeIntent | null
  onCloseRole: () => void
  onConfirmRole: (adminPassword?: string) => void
  roleLoading: boolean

  resetUser: AdminUser | null
  onCloseReset: () => void
  onConfirmReset: (adminPassword: string) => void
  resetLoading: boolean

  resetResult: { temporaryPassword: string; userLabel: string; email: string } | null
  onCloseResetResult: () => void
}

function roleLabel(name: Role['name'] | undefined) {
  return name ?? 'UNKNOWN'
}

export function AdminUserGovernanceModals({
  statusIntent,
  onCloseStatus,
  onConfirmStatus,
  statusLoading,
  roleIntent,
  onCloseRole,
  onConfirmRole,
  roleLoading,
  resetUser,
  onCloseReset,
  onConfirmReset,
  resetLoading,
  resetResult,
  onCloseResetResult,
}: AdminUserGovernanceModalsProps) {
  const [adminPassword, setAdminPassword] = useState('')

  useEffect(() => {
    setAdminPassword('')
  }, [
    statusIntent?.user.id,
    statusIntent?.next,
    resetUser?.id,
    roleIntent?.user.id,
    roleIntent?.nextRole,
    roleIntent?.step,
  ])

  const roleDouble =
    roleIntent != null &&
    needsDoubleRoleConfirm(roleIntent.user.role?.name, roleIntent.nextRole)

  const roleNeedsReauth = !roleDouble || (roleIntent != null && roleIntent.step === 2)

  const passwordExtra = (
    <Input
      type="password"
      label="Mật khẩu quản trị của bạn"
      autoComplete="current-password"
      value={adminPassword}
      onChange={(e) => setAdminPassword(e.target.value)}
      required
    />
  )

  const roleTitle = !roleIntent
    ? ''
    : !roleDouble
      ? 'Xác nhận đổi vai trò'
      : roleIntent.step === 2
        ? 'Xác nhận đổi vai trò (bước 2/2)'
        : 'Xác nhận đổi vai trò (bước 1/2)'

  const roleDescription = !roleIntent
    ? ''
    : !roleDouble
      ? `Gán vai trò ${roleLabel(roleIntent.nextRole)} cho ${roleIntent.user.name || roleIntent.user.email} (hiện tại: ${roleLabel(roleIntent.user.role?.name)}).`
      : roleIntent.step === 2
        ? `Thao tác này sẽ gán vai trò ${roleLabel(roleIntent.nextRole)} cho ${roleIntent.user.name || roleIntent.user.email}. Nhấn Xác nhận để hoàn tất.`
        : `Bạn sắp đổi vai trò của ${roleIntent.user.name || roleIntent.user.email} từ ${roleLabel(roleIntent.user.role?.name)} sang ${roleLabel(roleIntent.nextRole)}. Nhấn Tiếp tục để sang bước xác nhận cuối.`

  return (
    <>
      <ConfirmModal
        open={statusIntent !== null}
        onClose={onCloseStatus}
        onConfirm={() => {
          const pwd = adminPassword.trim()
          if (!pwd) return
          onConfirmStatus(pwd)
        }}
        extra={passwordExtra}
        confirmDisabled={!adminPassword.trim()}
        title={statusIntent?.next === 'locked' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        description={
          statusIntent
            ? statusIntent.next === 'locked'
              ? `Tài khoản ${statusIntent.user.name || statusIntent.user.email} sẽ không đăng nhập được cho đến khi được mở khóa. Phiên hiện tại sẽ bị vô hiệu sau khi hết hạn token.`
              : `Mở khóa cho ${statusIntent.user.name || statusIntent.user.email}. Người dùng có thể đăng nhập lại.`
            : ''
        }
        confirmLabel={statusIntent?.next === 'locked' ? 'Khóa' : 'Mở khóa'}
        variant={statusIntent?.next === 'locked' ? 'danger' : 'warning'}
        isLoading={statusLoading}
      />

      <ConfirmModal
        open={roleIntent !== null}
        onClose={onCloseRole}
        onConfirm={() => {
          if (!roleIntent) return
          const double = needsDoubleRoleConfirm(roleIntent.user.role?.name, roleIntent.nextRole)
          if (double && roleIntent.step === 1) {
            onConfirmRole()
            return
          }
          const pwd = adminPassword.trim()
          if (!pwd) return
          onConfirmRole(pwd)
        }}
        extra={roleIntent !== null && roleNeedsReauth ? passwordExtra : undefined}
        confirmDisabled={roleIntent !== null && roleNeedsReauth && !adminPassword.trim()}
        title={roleTitle}
        description={roleDescription}
        confirmLabel={
          roleIntent && needsDoubleRoleConfirm(roleIntent.user.role?.name, roleIntent.nextRole)
            ? roleIntent.step === 2
              ? 'Xác nhận'
              : 'Tiếp tục'
            : 'Xác nhận'
        }
        variant="warning"
        isLoading={roleLoading}
      />

      <ConfirmModal
        open={resetUser !== null}
        onClose={onCloseReset}
        onConfirm={() => {
          const pwd = adminPassword.trim()
          if (!pwd) return
          onConfirmReset(pwd)
        }}
        extra={passwordExtra}
        confirmDisabled={!adminPassword.trim()}
        title="Đặt lại mật khẩu?"
        description={
          resetUser
            ? `Hệ thống sẽ tạo mật khẩu tạm cho ${resetUser.name || resetUser.email}, thu hồi mọi phiên đăng nhập và buộc đăng nhập lại bằng mật khẩu mới. Chỉ chia sẻ mật khẩu qua kênh an toàn.`
            : ''
        }
        confirmLabel="Đặt lại mật khẩu"
        variant="danger"
        isLoading={resetLoading}
      />

      <Modal
        open={resetResult !== null}
        onClose={onCloseResetResult}
        title="Mật khẩu tạm đã tạo"
        description="Sao chép ngay — bạn sẽ không xem lại được giá trị này sau khi đóng."
        size="md"
        footer={
          <Button variant="primary" size="sm" onClick={onCloseResetResult}>
            Đã lưu, đóng
          </Button>
        }
      >
        {resetResult && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              <span className="text-foreground font-medium">{resetResult.userLabel}</span>
              <span className="mx-1">·</span>
              {resetResult.email}
            </p>
            <div className="flex gap-2">
              <Input readOnly value={resetResult.temporaryPassword} className="font-mono text-sm" />
              <Button
                type="button"
                variant="secondary"
                size="md"
                aria-label="Sao chép mật khẩu tạm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(resetResult.temporaryPassword)
                    toast.success('Đã sao chép mật khẩu tạm')
                  } catch {
                    toast.error('Không thể sao chép — hãy chọn và sao chép thủ công')
                  }
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
