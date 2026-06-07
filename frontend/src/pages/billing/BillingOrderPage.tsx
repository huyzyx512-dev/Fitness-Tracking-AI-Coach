import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { useOrderStatus } from '@/hooks/billing/useOrderStatus'
import { ROUTES } from '@/lib/constants'
import { formatDatetime } from '@/lib/utils'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { PaymentOrder, PaymentOrderStatus } from '@/types/billing.types'

const statusVariant: Record<PaymentOrderStatus, BadgeVariant> = {
  pending:   'warning',
  paid:      'success',
  expired:   'neutral',
  cancelled: 'neutral',
  failed:    'danger',
}

const statusLabel: Record<PaymentOrderStatus, string> = {
  pending:   'Đang chờ thanh toán',
  paid:      'Đã thanh toán',
  expired:   'Đơn đã hết hạn',
  cancelled: 'Đơn đã bị hủy',
  failed:    'Thanh toán thất bại',
}

export default function BillingOrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orderId = id ? Number(id) : undefined
  const { data: order, isLoading, error, refetch } = useOrderStatus(orderId)

  if (!orderId || Number.isNaN(orderId)) {
    return (
      <ErrorState
        message="ID đơn thanh toán không hợp lệ"
        onRetry={() => navigate(ROUTES.BILLING)}
      />
    )
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <PageHeader
        title="THANH TOÁN ĐƠN HÀNG"
        description="Quét mã QR hoặc chuyển khoản theo nội dung dưới đây"
        action={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate(ROUTES.BILLING)}
          >
            Quay lại danh sách gói
          </Button>
        }
      />

      {isLoading || !order ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <OrderDetail order={order} />
      )}
    </div>
  )
}

function OrderDetail({ order }: { order: PaymentOrder }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (order.status !== 'pending') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [order.status])

  const remainingMs = order.expiresAt
    ? Math.max(0, new Date(order.expiresAt).getTime() - now)
    : 0
  const remainingSec = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(remainingSec / 60)
  const seconds = remainingSec % 60

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <StatusIcon status={order.status} />
            <div>
              <p className="text-base font-semibold text-foreground">
                {statusLabel[order.status]}
              </p>
              <p className="text-sm text-muted mt-0.5">Mã đơn: {order.orderCode}</p>
              {order.plan && (
                <p className="text-sm text-muted">
                  Gói: {order.plan.name} · {order.plan.durationDays} ngày
                </p>
              )}
            </div>
          </div>
          <Badge variant={statusVariant[order.status]} dot>
            {statusLabel[order.status]}
          </Badge>
        </div>
      </Card>

      {/* Pending: show transfer instructions */}
      {order.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chuyển khoản</CardTitle>
          </CardHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR / instruction column */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-4">
              {order.qrUrl ? (
                <img
                  src={order.qrUrl}
                  alt="QR thanh toán"
                  className="h-56 w-56 object-contain rounded-xl bg-white p-2"
                />
              ) : (
                <div className="h-56 w-56 flex items-center justify-center rounded-xl border border-dashed border-border text-muted text-xs text-center px-4">
                  Chưa cấu hình QR — vui lòng chuyển khoản theo thông tin bên cạnh
                </div>
              )}
              <p className="text-xs text-muted text-center">
                Quét mã hoặc chuyển khoản với nội dung <strong>chính xác</strong> bên dưới.
              </p>
            </div>

            {/* Bank info column */}
            <div className="space-y-3">
              <CopyRow label="Số tiền" value={`${new Intl.NumberFormat('vi-VN').format(order.amount)} ${order.currency}`} icon={<Banknote size={14} />} />
              <CopyRow label="Nội dung chuyển khoản" value={order.paymentContent} highlight />
              {order.bankName && <CopyRow label="Ngân hàng" value={order.bankName} />}
              {order.bankAccount && <CopyRow label="Số tài khoản" value={order.bankAccount} highlight />}
              {order.accountName && <CopyRow label="Chủ tài khoản" value={order.accountName} />}
            </div>
          </div>

          {/* Countdown */}
          {order.expiresAt && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card-raised px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <Clock size={14} /> Đơn hết hạn lúc {formatDatetime(order.expiresAt)}
              </span>
              <span className="tabular-nums font-medium text-foreground">
                {remainingSec > 0
                  ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                  : 'Đã hết hạn'}
              </span>
            </div>
          )}

          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Loader2 size={12} className="animate-spin" /> Hệ thống tự động cập nhật khi thanh toán được ghi nhận.
          </p>
        </Card>
      )}

      {/* Paid: success card */}
      {order.status === 'paid' && (
        <Card>
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-14 w-14 rounded-2xl bg-success-bg text-success flex items-center justify-center mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Thanh toán thành công!</h3>
            <p className="text-sm text-muted mt-1 max-w-md">
              Cảm ơn bạn đã đăng ký. Quyền sử dụng đã được kích hoạt cho tài khoản của bạn.
            </p>
            <div className="mt-5 flex gap-3">
              <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Về tổng quan</Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.BILLING)}>
                Xem gói đăng ký
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Terminal failure */}
      {(order.status === 'expired' || order.status === 'failed' || order.status === 'cancelled') && (
        <Card>
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-14 w-14 rounded-2xl bg-danger-bg text-danger flex items-center justify-center mb-4">
              {order.status === 'expired' ? <Clock size={28} /> : <XCircle size={28} />}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {statusLabel[order.status]}
            </h3>
            <p className="text-sm text-muted mt-1 max-w-md">
              Đơn này không thể tiếp tục thanh toán. Bạn có thể tạo đơn mới để gia hạn.
            </p>
            <div className="mt-5">
              <Button onClick={() => navigate(ROUTES.BILLING)}>Tạo đơn mới</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: PaymentOrderStatus }) {
  const baseClass = 'h-10 w-10 rounded-xl flex items-center justify-center shrink-0'
  switch (status) {
    case 'paid':
      return (
        <div className={`${baseClass} bg-success-bg text-success`}>
          <CheckCircle2 size={20} />
        </div>
      )
    case 'pending':
      return (
        <div className={`${baseClass} bg-warning-bg text-warning`}>
          <Clock size={20} />
        </div>
      )
    case 'failed':
      return (
        <div className={`${baseClass} bg-danger-bg text-danger`}>
          <AlertCircle size={20} />
        </div>
      )
    default:
      return (
        <div className={`${baseClass} bg-card-raised text-muted`}>
          <XCircle size={20} />
        </div>
      )
  }
}

interface CopyRowProps {
  label:     string
  value:     string
  icon?:     React.ReactNode
  highlight?: boolean
}

function CopyRow({ label, value, icon, highlight }: CopyRowProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Đã sao chép ${label.toLowerCase()}`)
    } catch {
      toast.error('Trình duyệt không hỗ trợ sao chép')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
          {icon}
          {label}
        </p>
        <p
          className={`mt-1 text-sm tabular-nums truncate ${
            highlight ? 'font-semibold text-foreground' : 'text-foreground/90'
          }`}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-card-raised transition-colors shrink-0"
        aria-label={`Sao chép ${label}`}
      >
        <Copy size={14} />
      </button>
    </div>
  )
}
