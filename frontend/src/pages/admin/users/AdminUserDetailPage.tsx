import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { API_ENDPOINTS } from '@/lib/constants'

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>()
    const resolvedId = id ?? ':id'
    return (
        <section className="space-y-6 animate-fade-up">
            <PageHeader
                title="CHI TIẾT NGƯỜI DÙNG"
                description="Trang scaffold cho luồng xem/cập nhật hồ sơ và thao tác bảo mật cấp quản trị."
            />
            <Card className="space-y-3">
                <p className="text-sm text-muted">User đang xem: <span className="text-foreground font-medium">{resolvedId}</span></p>
                <p className="text-sm text-muted">GET endpoint: <code className="text-foreground">{API_ENDPOINTS.ADMIN_USER(resolvedId)}</code></p>
                <p className="text-sm text-muted">PATCH endpoint: <code className="text-foreground">{API_ENDPOINTS.ADMIN_USER(resolvedId)}</code></p>
                <p className="text-sm text-muted">Status endpoint: <code className="text-foreground">{API_ENDPOINTS.ADMIN_USER_STATUS(resolvedId)}</code></p>
                <p className="text-sm text-muted">Role endpoint: <code className="text-foreground">{API_ENDPOINTS.ADMIN_USER_ROLE(resolvedId)}</code></p>
            </Card>
        </section>
    )
}
