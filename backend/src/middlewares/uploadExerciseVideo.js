import fs from "fs";
import path from "path";
import multer from "multer";
import { appConfig } from "../config/env.js";
import { ValidationError } from "../errors/AppError.js";

/**
 * Allowed video MIME types for exercise uploads.
 * Max size: appConfig.exerciseVideoMaxBytes (default ~100 MiB, cap 150 MiB); set VIDEO_UPLOAD_MAX_MB to tune.
 */
const allowedMime = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/ogg",
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(appConfig.paths.exerciseVideosDir);
    cb(null, appConfig.paths.exerciseVideosDir);
  },
  filename: (req, file, cb) => {
    const id = req.params?.id ?? "new";
    const ext = path.extname(file.originalname) || ".mp4";
    const safeExt = ext.length > 10 ? ".mp4" : ext.toLowerCase();
    cb(null, `exercise-${id}-${Date.now()}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMime.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Định dạng video không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận MP4, WebM, MOV, v.v.`,
      ),
    );
  }
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: appConfig.exerciseVideoMaxBytes },
});

/** Multer instance for exercise video (field name: `video`). */
export const exerciseVideoUpload = uploader;

/** Express middleware: single file in field `video`. */
export const uploadExerciseVideo = uploader.single("video");
