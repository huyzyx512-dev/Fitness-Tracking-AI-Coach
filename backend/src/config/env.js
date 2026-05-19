import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, "../..");

const parseOrigins = (value) => {
  if (!value) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

/** Optional full origin for absolute URLs (e.g. https://api.example.com). If unset, controllers may derive from request. */
const publicBaseUrlRaw = process.env.PUBLIC_BASE_URL?.trim();

/** Max exercise video upload size (bytes). Default 100 MiB; override via VIDEO_UPLOAD_MAX_MB (e.g. 120). */
const videoUploadMaxMb = Number(process.env.VIDEO_UPLOAD_MAX_MB || "100");
const exerciseVideoMaxBytes = Math.min(
  150 * 1024 * 1024,
  Math.max(10 * 1024 * 1024, Math.round(videoUploadMaxMb * 1024 * 1024)),
);

const uploadsRoot = path.join(backendRoot, "uploads");
const exerciseVideosDir = path.join(uploadsRoot, "exercises");

/** AI provider configuration. All values come from env; never hardcode API key or model. */
const aiRequestTimeoutRaw = Number(process.env.AI_REQUEST_TIMEOUT_MS);
export const aiConfig = {
  enabled: process.env.AI_FEATURE_ENABLED === "true" || process.env.AI_FEATURE_ENABLED === "1",
  provider: process.env.AI_PROVIDER?.trim() || "openai",
  baseUrl: (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
  apiKey: process.env.AI_API_KEY?.trim() || "",
  model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
  requestTimeoutMs: Number.isFinite(aiRequestTimeoutRaw) && aiRequestTimeoutRaw > 0 ? aiRequestTimeoutRaw : 30000,
};

/** Sepay payment provider configuration. All values come from env; never hardcode real bank info. */
const sepayConfig = {
  enabled: process.env.SEPAY_PROVIDER_ENABLED === "1" || process.env.SEPAY_PROVIDER_ENABLED === "true",
  webhookSecret: process.env.SEPAY_WEBHOOK_SECRET?.trim() || undefined,
  bankAccount: process.env.SEPAY_BANK_ACCOUNT?.trim() || undefined,
  bankName: process.env.SEPAY_BANK_NAME?.trim() || undefined,
  accountName: process.env.SEPAY_ACCOUNT_NAME?.trim() || undefined,
  /** Optional QR template. Supports placeholders {amount} and {content}. */
  qrTemplate: process.env.SEPAY_QR_TEMPLATE?.trim() || undefined,
  /** Default order TTL in minutes. */
  orderTtlMinutes: Math.max(5, Number(process.env.SEPAY_ORDER_TTL_MINUTES || 30)),
};

export const appConfig = {
  nodeEnv,
  isProduction,
  authDebugAccess: !isProduction || process.env.AUTH_DEBUG_ACCESS === "1",
  port: Number(process.env.PORT || 5000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "dev-access-token-secret",
  refreshTokenTtlMs: 14 * 24 * 60 * 60 * 1000,
  /** Base URL for building stored video_url (no trailing slash). Optional; use resolvePublicBaseUrl(req) when missing. */
  publicBaseUrl: publicBaseUrlRaw ? publicBaseUrlRaw.replace(/\/$/, "") : undefined,
  exerciseVideoMaxBytes,
  paths: {
    uploadsRoot,
    exerciseVideosDir,
  },
  sepay: sepayConfig,
  ai: aiConfig,
};

export const buildRefreshTokenCookieOptions = (maxAge = appConfig.refreshTokenTtlMs) => ({
  httpOnly: true,
  secure: appConfig.isProduction,
  sameSite: appConfig.isProduction ? "none" : "lax",
  maxAge,
  ...(appConfig.cookieDomain ? { domain: appConfig.cookieDomain } : {}),
  path: "/",
});

