import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-8xl font-display text-danger/20 mb-4" style={{ fontFamily: 'var(--font-display)' }}>403</p>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg text-danger">
        <ShieldOff size={28} />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Truy cập bị từ chối</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">Bạn không có quyền truy cập trang này.</p>
      <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Về trang chủ</Button>
    </div>
  )
}
