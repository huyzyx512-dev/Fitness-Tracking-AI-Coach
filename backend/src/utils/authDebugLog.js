import { appConfig } from "../config/env.js";

export function maskEmail(email) {
  if (!email || typeof email !== "string") {
    return "(empty)";
  }
  const at = email.indexOf("@");
  if (at <= 0) {
    return "***";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedLocal = local.length <= 1 ? "*" : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

export function tokenTail(token) {
  if (!token || typeof token !== "string") {
    return undefined;
  }
  if (appConfig.isProduction) {
    return undefined;
  }
  return token.length <= 4 ? "****" : token.slice(-4);
}

export function authLog(event, detail = {}) {
  console.log(`[auth] ${event}`, detail);
}
