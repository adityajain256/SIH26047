import { Router } from "express";
import { acknowledgeAlert, approveSummary, generateSummary, getAlerts, getDoctorSummary, getStaffAssignments, getTimeline, grantConsent, revokeConsent, updateSummary } from "./clinical.controller.js";

const clinicalRoute = Router();
clinicalRoute.post("/patients/:id/consent", grantConsent);
clinicalRoute.patch("/consent/:id/revoke", revokeConsent);
clinicalRoute.post("/summaries/generate", generateSummary);
clinicalRoute.get("/triage/alerts", getAlerts);
clinicalRoute.post("/triage/alerts/:id/acknowledge", acknowledgeAlert);
clinicalRoute.get("/patients/:id/timeline", getTimeline);
clinicalRoute.get("/doctor/patients/:patientId/summary", getDoctorSummary);
clinicalRoute.get("/staff/assignments", getStaffAssignments);
clinicalRoute.patch("/summary/:id", updateSummary);
clinicalRoute.post("/summary/:id/approve", approveSummary);
export default clinicalRoute;
