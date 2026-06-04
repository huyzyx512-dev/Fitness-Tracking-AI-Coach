import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-8xl font-display text-accent/30 mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</p>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card-raised text-muted">
        <SearchX size={28} />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Trang không tồn tại</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">Trang bạn đang tìm kiếm đã bị xóa, đổi tên hoặc chưa từng tồn tại.</p>
      <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Về trang chủ</Button>
    </div>
  )
}
