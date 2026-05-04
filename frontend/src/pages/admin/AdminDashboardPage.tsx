import { Link } from 'react-router-dom'
import { ChevronRight, LayoutDashboard, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

const QUICK_ACTIONS = [
  {
    title: 'Quản trị người dùng',
    description: 'Xem danh sách tài khoản, tìm kiếm, lọc và xử lý sự cố theo vai trò/trạng thái.',
    to: ROUTES.ADMIN_USERS,
    icon: Users,
    buttonLabel: 'Mở danh sách',
  },
  {
    title: 'Tạo người dùng mới',
    description: 'Khởi tạo tài khoản nội bộ nhanh cho vận hành hoặc huấn luyện viên mới.',
    to: ROUTES.ADMIN_USER_NEW,
    icon: UserPlus,
    buttonLabel: 'Tạo ngay',
  },
] as const

const GOVERNANCE_NOTES = [
  'Ưu tiên khóa tài khoản thay vì xóa để giữ lịch sử audit.',
  'Mỗi thay đổi vai trò đều cần xác nhận mật khẩu quản trị.',
  'Không tự thay đổi vai trò/chặn chính tài khoản đang đăng nhập.',
]

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6 animate-fade-up">
      <PageHeader
        title="TỔNG QUAN QUẢN TRỊ"
        description="Điểm bắt đầu cho các tác vụ quản trị cốt lõi và nguyên tắc vận hành an toàn."
        action={
          <Link to={ROUTES.ADMIN_USERS}>
            <Button leftIcon={<LayoutDashboard size={16} />}>Đi tới quản trị người dùng</Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.to} className="h-full">
              <CardHeader className="items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl border border-border bg-card-raised flex items-center justify-center">
                    <Icon size={18} className="text-foreground" />
                  </div>
                  <div>
                    <CardTitle>{action.title}</CardTitle>
                    <p className="text-sm text-muted mt-1">{action.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Link to={action.to}>
                  <Button variant="secondary" rightIcon={<ChevronRight size={16} />}>
                    {action.buttonLabel}
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-foreground" />
            <CardTitle>Lưu ý vận hành</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2">
          {GOVERNANCE_NOTES.map((note) => (
            <p key={note} className="text-sm text-muted">
              - {note}
            </p>
          ))}
        </CardBody>
      </Card>
    </section>
  )
}
