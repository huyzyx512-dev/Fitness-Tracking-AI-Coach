import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { appConfig } from "../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { authLog } from "../utils/authDebugLog.js";

export const authenticationToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== "string") {
      throw new UnauthorizedError("Vui lòng cung cấp header Authorization");
    }

    const [, token] = authHeader.split(" ");
    if (!token) {
      throw new UnauthorizedError("Vui lòng cung cấp Access token");
    }

    const decodedUser = jwt.verify(token, appConfig.accessTokenSecret);
    const user = await db.User.findOne({
      where: { id: decodedUser.id },
      attributes: {
        exclude: ["password_hash"],
      },
      include: [{ model: db.Role, as: "role" }],
    });

    if (!user) {
      throw new UnauthorizedError("Người dùng không tồn tại");
    }

    if (decodedUser.tokenVersion !== user.tokenVersion) {
      throw new ForbiddenError("Token đã bị thu hồi");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      if (appConfig.authDebugAccess) {
        authLog("access_jwt_verify_failed", {
          errorName: error.name,
        });
      }
      // FIX: Map JWT errors to 401 để đồng bộ với frontend refresh interceptor
      return next(new UnauthorizedError("Access token không hợp lệ hoặc đã hết hạn"));
    }

    return next(error);
  }
};