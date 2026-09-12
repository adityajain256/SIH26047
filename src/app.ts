import express from "express";
import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import authRoute from "./authentication/auth.route.js";
import clinicalRoute from "./clinical/clinical.route.js";
import interviewRoute from "./interview/interview.route.js";
import patientRoute from "./patient/patient.route.js";
import voiceRoute from "./voice/voice.route.js";
dotenv.config();
const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get("Origin");
  const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", ...(process.env.FRONTEND_ORIGIN ?? "").split(",")].filter(Boolean);
  if (origin && allowedOrigins.includes(origin)) res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/app/users", authRoute);
app.use("/app/patients", patientRoute);
app.use("/app/interviews", interviewRoute);
app.use("/app/voice", voiceRoute);
app.use("/app", clinicalRoute);

export default app;
