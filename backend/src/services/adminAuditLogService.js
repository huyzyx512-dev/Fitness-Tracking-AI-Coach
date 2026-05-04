import db from "../models/index.js";

export const ADMIN_AUDIT_ACTIONS = {
  USER_STATUS_CHANGED: "USER_STATUS_CHANGED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
};

function clientIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim().slice(0, 45);
  }
  const ip = req.ip || req.socket?.remoteAddress;
  return typeof ip === "string" ? ip.slice(0, 45) : null;
}

/**
 * @param {object} params
 * @param {number} params.actorUserId
 * @param {number} params.targetUserId
 * @param {string} params.action
 * @param {object} [params.metadata]
 * @param {import('express').Request} [params.req]
 */
export async function recordAdminAudit({ actorUserId, targetUserId, action, metadata, req }) {
  await db.AdminAuditLog.create({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action,
    metadata: metadata && typeof metadata === "object" ? metadata : {},
    ip_address: clientIp(req),
    user_agent: typeof req?.headers?.["user-agent"] === "string" ? req.headers["user-agent"] : null,
  });
}
