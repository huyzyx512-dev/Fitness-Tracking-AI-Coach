import bcrypt from "bcrypt";
import db from "../models/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import TokenService from "./tokenService.js";
import { authLog, maskEmail, tokenTail } from "../utils/authDebugLog.js";
import { ADMIN_AUDIT_ACTIONS, recordAdminAudit } from "./adminAuditLogService.js";

const VALID_GENDERS = ["male", "female", "other"];

function parseGender(value) {
  const normalized = value?.toLowerCase();
  return VALID_GENDERS.includes(normalized) ? normalized : null;
}

class AuthService {
  static async register(payload) {
    const existingUser = await db.User.findOne({ where: { email: payload.email } });
    if (existingUser) {
      throw new ConflictError("Email đã tồn tại");
    }

    const defaultRole = await db.Role.findOne({ where: { name: "USER" } });
    if (!defaultRole) {
      throw new NotFoundError("Vai trò mặc định không được chọn");
    }

    const gender = parseGender(payload.gender);
    if (!gender) {
      throw new ConflictError("Giới tính không hợp lệ. Chỉ chấp nhận: male, female, other");
    }

    const password_hash = await bcrypt.hash(payload.password, 10);

    try {
      await db.User.create({
        email: payload.email,
        password_hash,
        name: payload.name,
        role_id: defaultRole.id,
        date_of_birth: payload.birthday,
        height: payload.height,
        weight: payload.weight,
        gender,
      });

      console.log("User created successfully");
    } catch (err) {
      console.error("Create user error:", err);
      throw new Error("Create user error");
    }
  }

  static async login({ email, password }, req) {
    authLog("login_attempt", { email: maskEmail(email) });

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    if (Number(user.tokenVersion) < 0) {
      throw new ForbiddenError("Tài khoản đã bị khóa");
    }

    const accessToken = TokenService.createAccessToken(user.id, user.tokenVersion);
    console.log("accessToken", accessToken);
    const refreshToken = await TokenService.createRefreshSession(user);
    console.log("refreshToken", refreshToken);

    authLog("access_issued", {
      userId: user.id,
      ...(tokenTail(accessToken) ? { accessTail: tokenTail(accessToken) } : {}),
    });
    authLog("refresh_session_created", {
      userId: user.id,
      ...(tokenTail(refreshToken) ? { refreshTail: tokenTail(refreshToken) } : {}),
    });

    await recordAdminAudit({
      actorUserId: user.id,
      targetUserId: user.id,
      action: ADMIN_AUDIT_ACTIONS.USER_LOGIN,
      metadata: { email: user.email },
      req,
    });

    return {
      accessToken,
      refreshToken,
      userName: user.name,
      userId: user.id,
    };
  }

  static async refreshAccessToken(token) {
    const { userId, tokenVersion } = await TokenService.findRefreshToken(token);
    if (!userId) {
      throw new UnauthorizedError("Refresh token không hợp lệ");
    }

    const accessToken = TokenService.createAccessToken(userId, tokenVersion);
    authLog("refresh_ok", { userId});
    authLog("access_issued", {
      userId,
      ...(tokenTail(accessToken) ? { accessTail: tokenTail(accessToken) } : {}),
    });

    return {
      accessToken,
    };
  }
}

export default AuthService;

