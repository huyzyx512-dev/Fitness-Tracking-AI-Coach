import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, MoreHorizontal, ShieldCheck, Unlock, UserCog, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Dropdown } from '@/components/ui/Dropdown'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { ROUTES, ROLE } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useAdminUserList } from '@/hooks/user/useAdminUserList'
import { useUpdateAdminUserStatus } from '@/hooks/user/useUpdateAdminUserStatus'
import { useUpdateAdminUserRole } from '@/hooks/user/useUpdateAdminUserRole'
import type { AdminUser, AdminUserStatus } from '@/types/admin-user.types'
import type { Column } from '@/components/ui/Table'
import type { BadgeVariant } from '@/components/ui/Badge'

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: ROLE.ADMIN, label: 'ADMIN' },
  { value: ROLE.COACH, label: 'COACH' },
  { value: ROLE.USER, label: 'USER' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đang khóa' },
]

const statusVariant: Record<AdminUserStatus, BadgeVariant> = {
  active: 'success',
  locked: 'danger',
}

export default function AdminUserListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const queryParams = useMemo(
    () => ({
      search: search.trim(),
      role: role as '' | 'ADMIN' | 'USER' | 'COACH',
      status: status as '' | AdminUserStatus,
      page,
      limit,
    }),
    [search, role, status, page, limit],
  )

  const { data, isLoading, error, refetch } = useAdminUserList(queryParams)
  const updateStatus = useUpdateAdminUserStatus()
  const updateRole = useUpdateAdminUserRole()

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Người dùng',
      render: (u) => (
        <div>
          <p className="font-medium text-foreground">{u.name || 'Chưa cập nhật'}</p>
          <p className="text-xs text-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (u) => (
        <Badge variant={u.role?.name === 'ADMIN' ? 'accent' : 'info'}>
          {u.role?.name || 'UNKNOWN'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (u) => (
        <Badge variant={statusVariant[u.status]} dot>
          {u.status === 'active' ? 'Đang hoạt động' : 'Đang khóa'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (u) => <span className="text-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (u) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="icon" aria-label="Hành động nhanh">
              <MoreHorizontal size={15} />
            </Button>
          }
          items={[
            {
              label: 'Xem chi tiết',
              icon: <Users size={13} />,
              onClick: () => navigate(ROUTES.ADMIN_USER_DETAIL(u.id)),
            },
            {
              label: u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
              icon: u.status === 'active' ? <Lock size={13} /> : <Unlock size={13} />,
              onClick: () =>
                updateStatus.mutate({
                  id: u.id,
                  status: u.status === 'active' ? 'locked' : 'active',
                }),
            },
            {
              label: 'Đổi sang COACH',
              icon: <UserCog size={13} />,
              onClick: () => updateRole.mutate({ id: u.id, role: 'COACH' }),
              disabled: u.role?.name === 'COACH',
            },
            {
              label: 'Đổi sang USER',
              icon: <UserCog size={13} />,
              onClick: () => updateRole.mutate({ id: u.id, role: 'USER' }),
              disabled: u.role?.name === 'USER',
            },
            {
              label: 'Đổi sang ADMIN',
              icon: <ShieldCheck size={13} />,
              onClick: () => updateRole.mutate({ id: u.id, role: 'ADMIN' }),
              disabled: u.role?.name === 'ADMIN',
            },
          ]}
          align="right"
        />
      ),
    },
  ]

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <section className="space-y-5 animate-fade-up">
      <PageHeader
        title="QUẢN TRỊ NGƯỜI DÙNG"
        description="Quản lý tài khoản với tìm kiếm, lọc và hành động nhanh theo vai trò/trạng thái."
        action={
          <Link to={ROUTES.ADMIN_USER_NEW}>
            <Button>Tạo người dùng</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Tìm theo tên hoặc email..."
          />
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            options={ROLE_OPTIONS}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table
            columns={columns}
            data={data?.users ?? []}
            keyExtractor={(u) => u.id}
            isLoading={isLoading}
            emptyTitle="Không tìm thấy người dùng"
            emptyDesc="Thử đổi bộ lọc hoặc từ khóa tìm kiếm."
            onRowClick={(u) => navigate(ROUTES.ADMIN_USER_DETAIL(u.id))}
          />
        </div>

        <Pagination
          page={data?.pagination.page ?? 1}
          limit={data?.pagination.limit ?? limit}
          total={data?.pagination.total ?? 0}
          onChange={setPage}
        />
      </Card>
    </section>
  )
}
