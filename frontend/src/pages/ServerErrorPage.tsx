import { useNavigate } from 'react-router-dom'
import { ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

export default function ServerErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-8xl font-display text-warning/20 mb-4" style={{ fontFamily: 'var(--font-display)' }}>500</p>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-bg text-warning">
        <ServerCrash size={28} />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Lỗi máy chủ</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>Tải lại trang</Button>
        <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Về trang chủ</Button>
      </div>
    </div>
  )
}
