import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { API_ENDPOINTS, ROLE } from '@/lib/constants'

export default function AdminUserCreatePage() {
    return (
      <section className="space-y-6 animate-fade-up">
        <PageHeader
          title="TẠO NGƯỜI DÙNG"
          description="MVP scaffold cho tạo tài khoản thủ công từ khu vực admin."
        />
        <Card className="space-y-3">
          <p className="text-sm text-muted">
            API tạo user: <code className="text-foreground">{API_ENDPOINTS.ADMIN_USERS}</code>
          </p>
          <p className="text-sm text-muted">
            Role hỗ trợ: <span className="text-foreground">{ROLE.USER}</span>,{' '}
            <span className="text-foreground">{ROLE.COACH}</span>,{' '}
            <span className="text-foreground">{ROLE.ADMIN}</span>
          </p>
          <p className="text-sm text-muted">
            Bước tiếp theo: nối form + validator để tạo user và tùy chọn gửi mật khẩu tạm.
          </p>
        </Card>
      </section>
    )
  }
  