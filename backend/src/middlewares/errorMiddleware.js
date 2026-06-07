import multer from "multer";
import { AppError } from "../errors/AppError.js";

const { MulterError } = multer;

export const notFoundHandler = (req, res) => {
  return res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} không tìm thấy` });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File video vượt quá dung lượng cho phép. Hãy thử file nhỏ hơn hoặc liên hệ quản trị.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Gửi đúng trường file tên 'video'." });
    }
    return res.status(400).json({ message: error.message || "Lỗi tải file" });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  return res.status(500).json({
    message: "Lỗi hệ thống",
  });
};

