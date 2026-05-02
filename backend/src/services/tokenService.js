import crypto from "crypto";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { appConfig } from "../config/env.js";
import { authLog } from "../utils/authDebugLog.js";

class TokenService {
  static createAccessToken(userId, tokenVersion) {
    return jwt.sign(
      { id: userId, tokenVersion: tokenVersion },
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

  static async findRefreshToken(token) {
    
    if (!token) {
      return null;
    }

    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken) return null;

    if (refreshToken.expiryDate < new Date()) {
      this.revokeRefreshToken(token);
      return null;
    }

    const user = await db.User.findOne({ where: { id: refreshToken.userId } });
    if (!user) return null;

    if (refreshToken.tokenVersion !== user.tokenVersion) {
      return null;
    }

    return { userId: user.id, tokenVersion: user.tokenVersion };
  }
}

export default TokenService;

