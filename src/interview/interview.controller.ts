import type { Request, Response } from "express";
import { getClinicalQuestion, startClinicalInterview, submitClinicalAnswer, updateClinicalLanguage } from "./clinical-interview.service.js";

const isMode = (value: unknown): value is "general" | "ayush" => value === "general" || value === "ayush";

const sendError = (res: Response, error: unknown) => {
  const candidate = typeof error === "object" && error && ("statusCode" in error ? error.statusCode : "status" in error ? error.status : undefined);
  const status = typeof candidate === "number" && candidate >= 400 && candidate < 600 ? candidate : 500;
  console.error("Interview request failed:", error);
  return res.status(status).json({ message: status === 500 ? "Server issue." : error instanceof Error ? error.message : "Request failed." });
};

export async function createInterview(req: Request, res: Response) {
  const { patientId, mode, language = "en" } = req.body as { patientId?: unknown; mode?: unknown; language?: unknown };
  const id = Number(patientId);
  if (!Number.isInteger(id) || id < 1 || !isMode(mode) || (language !== "en" && language !== "hi")) return res.status(400).json({ message: "A valid patientId, mode, and language are required." });
  try {
    const interview = await startClinicalInterview(id, mode, language);
    if (!interview) return res.status(404).json({ message: "Patient not found." });
    return res.status(201).json(interview);
  } catch (error) { return sendError(res, error); }
}

export async function getNextQuestion(req: Request, res: Response) {
  try {
    const question = await getClinicalQuestion(String(req.params.id));
    if (question === undefined) return res.status(404).json({ message: "Interview not found." });
    return res.json(question);
  } catch (error) { return sendError(res, error); }
}

export async function updateInterviewLanguage(req: Request, res: Response) {
  const { language } = req.body as { language?: unknown };
  if (language !== "en" && language !== "hi") return res.status(400).json({ message: "A valid language is required." });
  try {
    const question = await updateClinicalLanguage(String(req.params.id), language);
    if (question === undefined) return res.status(404).json({ message: "Interview not found." });
    return res.json(question);
  } catch (error) { return sendError(res, error); }
}

async function answer(req: Request, res: Response, voice = false) {
  const body = req.body as { questionId?: unknown; answer?: unknown; spokenTranscript?: unknown; translatedAnswer?: unknown; language?: unknown };
  const value = voice ? body.translatedAnswer : body.answer;
  if (typeof body.questionId !== "string" || typeof value !== "string" || !value.trim()) return res.status(400).json({ message: "A questionId and answer are required." });
  if (voice && (typeof body.spokenTranscript !== "string" || (body.language !== "en" && body.language !== "hi"))) return res.status(400).json({ message: "Voice answers require transcript and language." });

  try {
    const response = await submitClinicalAnswer(String(req.params.id), body.questionId, value.trim(), voice ? { spokenTranscript: body.spokenTranscript as string, language: body.language as "en" | "hi" } : undefined);
    if (response === undefined) return res.status(404).json({ message: "Interview not found." });
    if (response === "invalid-question") return res.status(409).json({ message: "This answer does not match the current question." });
    return res.json(response);
  } catch (error) { return sendError(res, error); }
}

export const answerInterview = (req: Request, res: Response) => answer(req, res);
export const answerVoiceInterview = (req: Request, res: Response) => answer(req, res, true);
