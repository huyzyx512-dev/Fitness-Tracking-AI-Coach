import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { useBillingPlans } from '@/hooks/billing/useBillingPlans'
import { useCurrentSubscription } from '@/hooks/billing/useCurrentSubscription'
import { useCreateOrder } from '@/hooks/billing/useCreateOrder'
import { formatDate } from '@/lib/utils'
import type { SubscriptionPlan, SubscriptionPlanCode } from '@/types/billing.types'

const planIcon: Record<string, React.ReactNode> = {
  FREE:      <Sparkles size={20} />,
  PRO:       <Zap      size={20} />,
  COACH_PRO: <Crown    size={20} />,
}

function formatPrice(price: number, currency: string): string {
  if (price <= 0) return 'Miễn phí'
  return `${new Intl.NumberFormat('vi-VN').format(price)} ${currency}`
}

export default function BillingPage() {
  const { data: plans, isLoading, error, refetch } = useBillingPlans()
  const { data: subscription } = useCurrentSubscription()
  const createOrder = useCreateOrder()

  const currentPlanCode = subscription?.plan?.code as SubscriptionPlanCode | undefined

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="GÓI ĐĂNG KÝ"
        description="Mở khóa toàn bộ tính năng FitTrack với các gói trả phí"
      />

      {/* Current subscription summary */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Gói hiện tại</p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {subscription?.plan?.name ?? 'Free'}
            </p>
            {subscription?.expiresAt && (
              <p className="text-sm text-muted mt-1">
                Hết hạn: {formatDate(subscription.expiresAt)}
              </p>
            )}
          </div>
          <Badge variant={subscription ? 'success' : 'neutral'} dot>
            {subscription ? 'Đang hoạt động' : 'Chưa có gói trả phí'}
          </Badge>
        </div>
      </Card>

      {/* Plans grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlanCode === plan.code}
              isLoading={createOrder.isPending && createOrder.variables?.planCode === plan.code}
              onSelect={() => createOrder.mutate({ planCode: plan.code })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PlanCardProps {
  plan:       SubscriptionPlan
  isCurrent:  boolean
  isLoading:  boolean
  onSelect:   () => void
}

function PlanCard({ plan, isCurrent, isLoading, onSelect }: PlanCardProps) {
  const isFree = plan.price <= 0
  const highlighted = plan.code === 'PRO'

  return (
    <Card
      className={`flex flex-col gap-4 ${
        highlighted ? 'border-accent/40 ring-1 ring-accent/20' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            {planIcon[plan.code] ?? <Sparkles size={18} />}
          </div>
          <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
        </div>
        {highlighted && <Badge variant="accent">Phổ biến</Badge>}
        {isCurrent && <Badge variant="success">Đang dùng</Badge>}
      </div>

      <div>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {formatPrice(plan.price, plan.currency)}
        </p>
        {!isFree && (
          <p className="text-xs text-muted mt-1">
            cho {plan.durationDays} ngày sử dụng
          </p>
        )}
      </div>

      <ul className="space-y-2 text-sm text-muted flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check size={14} className="text-success shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={highlighted ? 'primary' : 'secondary'}
        loading={isLoading}
        disabled={isFree || isCurrent}
        onClick={onSelect}
      >
        {isFree ? 'Gói mặc định' : isCurrent ? 'Đang sử dụng' : 'Chọn gói'}
      </Button>
    </Card>
  )
}
