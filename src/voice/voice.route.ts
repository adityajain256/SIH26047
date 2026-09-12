import { Router } from "express";
import { createLiveToken } from "./voice.controller.js";

const voiceRoute = Router();
voiceRoute.post("/live-token", createLiveToken);

export default voiceRoute;
