/* ─── Billing / Subscription domain ──────────────────────── */

export type SubscriptionPlanCode = 'FREE' | 'PRO' | 'COACH_PRO' | string

export interface SubscriptionPlan {
  id:           number
  code:         SubscriptionPlanCode
  name:         string
  price:        number
  currency:     string
  durationDays: number
  features:     string[]
  isActive:     boolean
}

export type PaymentOrderStatus =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'failed'

export interface PaymentOrder {
  id:             number
  orderCode:      string
  provider:       string
  status:         PaymentOrderStatus
  amount:         number
  currency:       string
  paymentContent: string
  qrUrl:          string | null
  paymentUrl:     string | null
  bankAccount:    string | null
  bankName:       string | null
  accountName:    string | null
  expiresAt:      string | null
  paidAt:         string | null
  plan?:          SubscriptionPlan
  createdAt:      string
}

export interface UserSubscription {
  id:        number
  status:    'active' | 'expired' | 'cancelled'
  startedAt: string
  expiresAt: string
  plan:      SubscriptionPlan | null
}

/* ─── Request payloads ──────────────────────────────────── */

export interface CreateOrderPayload {
  planCode: SubscriptionPlanCode
}

/* ─── Response shapes ───────────────────────────────────── */

export interface BillingPlansResponse {
  plans: SubscriptionPlan[]
}

export interface BillingSubscriptionResponse {
  subscription: UserSubscription | null
}

export interface BillingOrderResponse {
  order: PaymentOrder
}
