import type { Role } from '@/types/auth.types'

export function needsDoubleRoleConfirm(
  current: Role['name'] | undefined,
  next: Role['name'],
): boolean {
  if (!current || current === next) return false
  if (current === 'ADMIN' && next !== 'ADMIN') return true
  if (next === 'ADMIN') return true
  return false
}
