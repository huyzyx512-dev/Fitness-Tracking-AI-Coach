/**
 * Tier ordering: requesting PRO is satisfied by COACH_PRO. Admin always passes.
 * Source of truth is the user.subscription_tier + user.subscription_expires_at cache fields,
 * which are kept in sync by BillingService when a payment succeeds. The authoritative table
 * remains user_subscription — refresh the cache there if you ever bypass the billing flow.
 */
const TIER_RANK = {
  FREE: 0,
  PRO: 1,
  COACH_PRO: 2,
};

function effectiveTier(user) {
  if (!user) return "FREE";
  const tier = user.subscription_tier || "FREE";
  if (tier === "FREE") return "FREE";
  const expiresAt = user.subscription_expires_at
    ? new Date(user.subscription_expires_at)
    : null;
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return "FREE";
  }
  return tier;
}

export const requireEntitlement = (requiredTier) => (req, res, next) => {
  if (req.user?.role?.name === "ADMIN") {
    return next();
  }

  const required = TIER_RANK[requiredTier] ?? TIER_RANK.PRO;
  const current = TIER_RANK[effectiveTier(req.user)] ?? TIER_RANK.FREE;

  if (current < required) {
    return res.status(403).json({
      message: `Tính năng này yêu cầu gói ${requiredTier}`,
    });
  }

  return next();
};
