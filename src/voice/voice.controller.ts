import { GoogleGenAI, Modality } from "@google/genai";
import type { Request, Response } from "express";

const models = {
  "input-translation": "gemini-3.5-live-translate-preview",
  "question-speech": "gemini-3.1-flash-live-preview",
} as const;

export async function createLiveToken(req: Request, res: Response) {
  const { purpose, language } = req.body as { purpose?: unknown; language?: unknown };
  if ((purpose !== "input-translation" && purpose !== "question-speech") || (language !== "en" && language !== "hi")) return res.status(400).json({ message: "A valid purpose and language are required." });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "Gemini Live is not configured on this server." });

  const languageName = language === "hi" ? "Hindi" : "English";
  const config = purpose === "input-translation"
    ? {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        translationConfig: { targetLanguageCode: "en", echoTargetLanguage: true },
      }
    : {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: { languageCodes: [language === "hi" ? "hi-IN" : "en-IN"] },
        systemInstruction: `Translate and speak only the supplied backend clinical question in ${languageName}. Do not add questions, advice, diagnoses, or other content.`,
      };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const expiresAt = new Date(Date.now() + 30 * 60 * 1_000);
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: expiresAt.toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60 * 1_000).toISOString(),
        liveConnectConstraints: { model: models[purpose], config },
      },
    });
    if (!token.name) return res.status(502).json({ message: "Gemini did not issue a Live token." });
    return res.status(201).json({ token: token.name, model: models[purpose], expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error("Gemini Live token creation failed:", error);
    return res.status(502).json({ message: "Could not create a Gemini Live token." });
  }
}
