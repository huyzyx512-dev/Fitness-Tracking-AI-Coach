import { appConfig } from "../config/env.js";

/**
 * Base URL for absolute links to this API (and /uploads). Prefer PUBLIC_BASE_URL in production behind proxies.
 */
export function resolvePublicBaseUrl(req) {
  if (appConfig.publicBaseUrl) {
    return appConfig.publicBaseUrl;
  }
  const host = req.get("host");
  if (!host) {
    return "";
  }
  return `${req.protocol}://${host}`;
}

/**
 * Full public URL for a file under the uploads root, e.g. "exercises/foo.mp4" -> {base}/uploads/exercises/foo.mp4
 */
export function publicUrlForUploadRelativePath(req, relativePath) {
  const base = resolvePublicBaseUrl(req);
  const clean = String(relativePath).replace(/^\/+/, "");
  return `${base}/uploads/${clean}`;
}
