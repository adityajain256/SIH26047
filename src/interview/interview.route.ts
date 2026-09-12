import { Router } from "express";
import { answerInterview, answerVoiceInterview, createInterview, getNextQuestion, updateInterviewLanguage } from "./interview.controller.js";

const interviewRoute = Router();

interviewRoute.post("/", createInterview);
interviewRoute.get("/:id/next-question", getNextQuestion);
interviewRoute.patch("/:id/language", updateInterviewLanguage);
interviewRoute.post("/:id/answer", answerInterview);
interviewRoute.post("/:id/voice-answer", answerVoiceInterview);

export default interviewRoute;
