import crypto from "crypto";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { appConfig } from "../config/env.js";
import { authLog } from "../utils/authDebugLog.js";

class TokenService {
  static createAccessToken(user) {
    return jwt.sign(
      { id: user.id, tokenVersion: user.tokenVersion },
      appConfig.accessTokenSecret,
      { expiresIn: "15m" },
    );
  }

  static generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  }

  static async createRefreshSession(user) {
    const token = this.generateRefreshToken();
    const expiryDate = new Date(Date.now() + appConfig.refreshTokenTtlMs);

    await db.RefreshToken.create({
      token,
      expiryDate,
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    authLog("refresh_session_stored", {
      userId: user.id,
      expiryIso: expiryDate.toISOString(),
    });

    return token;
  }

  static async revokeRefreshToken(token) {
    if (!token) {
      return 0;
    }

    return db.RefreshToken.destroy({
      where: { token },
    });
  }

  static async revokeAllUserSessions(userId) {
    await db.RefreshToken.destroy({
      where: { userId },
    });
  }
}

export default TokenService;

