import asyncHandler from "../middlewares/asyncHandler.js";
import AuthService from "../services/authService.js";
import TokenService from "../services/tokenService.js";
import UserService from "../services/userService.js";
import { buildRefreshTokenCookieOptions } from "../config/env.js";
import { parseSchema } from "../validators/common.js";
import { loginSchema, registerSchema } from "../validators/authValidator.js";
import { authLog } from "../utils/authDebugLog.js";

export const register = asyncHandler(async (req, res) => {
  const payload = parseSchema(registerSchema, req.body);
  await AuthService.register(payload);
  return res.sendStatus(204);
});

export const login = asyncHandler(async (req, res) => {
  const payload = parseSchema(loginSchema, req.body);
  const result = await AuthService.login(payload);

  authLog("login_response_200", { userId: result.userId });

  res.cookie(
    "refreshToken",
    result.refreshToken,
    buildRefreshTokenCookieOptions(),
  );

  return res.status(200).json({
    message: `Người dùng ${result.userName} đã đăng nhập`,
    accessToken: result.accessToken,
  });
});

// FIX: Allow logout via refresh cookie even if access token is expired/missing
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  try {
    const {userId} = await TokenService.findRefreshToken(token);

    if (userId) {
      await UserService.incrementTokenVersion(userId);
      await TokenService.revokeAllUserSessions(userId);
    }

    res.clearCookie("refreshToken", buildRefreshTokenCookieOptions(0));
    return res.sendStatus(204);
  } catch (error) {
    authLog("logout_error", { error: error.message });
    return res.sendStatus(401);
  }
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  authLog("refresh_route_called", { hasRefreshCookie: Boolean(token) });

  const result = await AuthService.refreshAccessToken(token);

  return res.status(200).json(result);
});
