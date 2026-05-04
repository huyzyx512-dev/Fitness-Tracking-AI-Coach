import { Users, ShieldCheck, UserX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { API_ENDPOINTS } from '@/lib/constants'
const mvpRoutes = [
    { method: 'GET', endpoint: API_ENDPOINTS.ADMIN_USERS, note: 'Danh sách user + search/filter/pagination' },
    { method: 'POST', endpoint: API_ENDPOINTS.ADMIN_USERS, note: 'Tạo user thủ công' },
    { method: 'GET', endpoint: API_ENDPOINTS.ADMIN_USER(':id'), note: 'Chi tiết user' },
    { method: 'PATCH', endpoint: API_ENDPOINTS.ADMIN_USER(':id'), note: 'Cập nhật hồ sơ user' },
    { method: 'PATCH', endpoint: API_ENDPOINTS.ADMIN_USER_STATUS(':id'), note: 'Khóa / mở khóa tài khoản' },
    { method: 'PATCH', endpoint: API_ENDPOINTS.ADMIN_USER_ROLE(':id'), note: 'Đổi role user' },
]
export default function AdminUserListPage() {
    return (
        <section className="space-y-6 animate-fade-up">
            <PageHeader
                title="QUẢN TRỊ NGƯỜI DÙNG"
                description="MVP route scaffold đã được chốt để triển khai danh sách, trạng thái và phân quyền."
            />
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <div className="flex items-center gap-3">
                        <Users className="text-accent" size={18} />
                        <p className="text-sm text-muted">Danh sách, lọc và phân trang user</p>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-accent" size={18} />
                        <p className="text-sm text-muted">Đổi role với route riêng cho admin</p>
                    </div >
                </Card >
                <Card>
                    <div className="flex items-center gap-3">
                        <UserX className="text-accent" size={18} />
                        <p className="text-sm text-muted">Khóa/mở khóa tài khoản bằng status endpoint</p>
                    </div>
                </Card>
            </div >
            <Card>
                <CardHeader>
                    <CardTitle>Admin User API (MVP)</CardTitle>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {mvpRoutes.map((item) => (
                            <div key={`${item.method}-${item.endpoint}`} className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                                        {item.method}
                                    </span>
                                    <code className="text-sm text-foreground">{item.endpoint}</code>
                                </div>
                                <p className="mt-2 text-sm text-muted">{item.note}</p>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </section >
    )
}
