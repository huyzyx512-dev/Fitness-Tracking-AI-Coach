import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import workoutRoute from "./routes/workoutRoute.js";
import exerciseRoute from "./routes/exerciseRoute.js";
import workoutLogRoute from "./routes/workoutLogRoute.js";
import billingRoute from "./routes/billingRoute.js";
import billingWebhookRoute from "./routes/billingWebhookRoute.js";
import aiRoute from "./routes/aiRoute.js";
import { authenticationToken } from "./middlewares/authMiddleware.js";
import { appConfig } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: appConfig.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-SePay-Signature",
      "X-SePay-Timestamp",
    ],
  }),
);

app.use(express.urlencoded({ extended: false }));

/**
 * SePay HMAC-SHA256 signs the raw request bytes. Global express.json() would replace req.body
 * with a parsed object and break signature verification. Register webhook routes with raw body first.
 * @see https://developer.sepay.vn/en/sepay-webhooks/lap-trinh-webhooks/lap-trinh-webhook-nodejs
 */
app.use(
  "/api/billing/webhooks",
  express.raw({ type: "*/*", limit: "2mb" }),
  billingWebhookRoute,
);

app.use(express.json());
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(appConfig.paths.uploadsRoot, {
    maxAge: appConfig.isProduction ? "1d" : 0,
  }),
);

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/workouts", authenticationToken, workoutRoute);
app.use("/api/exercises", exerciseRoute);
app.use("/api/workout-logs", authenticationToken, workoutLogRoute);
app.use("/api/ai", authenticationToken, aiRoute);

app.use("/api/billing", billingRoute);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
