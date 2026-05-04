import bcrypt from "bcrypt";
import db from "../models/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import TokenService from "./tokenService.js";

const VALID_GENDERS = ["nam", "nữ", "khác"];

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
      throw new ConflictError("Giới tính không hợp lệ. Chỉ chấp nhận: nam, nữ, khác");
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

  static async login({ email, password }) {
    console.log("User: ", email);
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      console.log("User not found");
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Email hoặc mật khẩu không chính xác");
    }

    if (Number(user.tokenVersion) < 0) {
      throw new ForbiddenError("Tài khoản đã bị khóa");
    }

    const accessToken = TokenService.createAccessToken(user);
    const refreshToken = await TokenService.createRefreshSession(user);

    return {
      accessToken,
      refreshToken,
      userName: user.name,
    };
  }

  static async refreshAccessToken(token) {
    if (!token) {
      throw new UnauthorizedError("Vui lòng cung cấp refresh token");
    }

    const session = await db.RefreshToken.findOne({ where: { token } });
    if (!session) {
      throw new UnauthorizedError("Refresh token không hợp lệ");
    }

    if (session.expiryDate.getTime() < Date.now()) {
      await TokenService.revokeRefreshToken(token);
      throw new UnauthorizedError("Vui lòng đăng nhập lại");
    }

    const user = await db.User.findByPk(session.userId);
    if (!user) {
      throw new UnauthorizedError("Không tìm thấy người dùng");
    }

    if (session.tokenVersion !== user.tokenVersion) {
      await TokenService.revokeRefreshToken(token);
      throw new UnauthorizedError("Refresh token đã bị thu hồi");
    }

    return {
      accessToken: TokenService.createAccessToken(user),
    };
  }
}

export default AuthService;

