import type { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { ConsentStatus, ConsentType, SummarySectionType, SummaryStatus, TimelineSource } from "../generated/prisma/enums.js";
import { generateClinicalSummary, summaryResponse } from "../interview/clinical-interview.service.js";

const consentTypes = { history_collection: ConsentType.HISTORY_COLLECTION, document_processing: ConsentType.DOCUMENT_PROCESSING, data_sharing: ConsentType.DATA_SHARING } as const;
const sectionTypes = { chiefComplaint: SummarySectionType.CHIEF_COMPLAINT, hpi: SummarySectionType.HPI, pastMedicalHistory: SummarySectionType.PAST_MEDICAL_HISTORY, pastSurgicalHistory: SummarySectionType.PAST_SURGICAL_HISTORY, medications: SummarySectionType.MEDICATIONS, allergies: SummarySectionType.ALLERGIES, familyHistory: SummarySectionType.FAMILY_HISTORY, personalHistory: SummarySectionType.PERSONAL_HISTORY, reviewOfSystems: SummarySectionType.REVIEW_OF_SYSTEMS } as const;
const param = (req: Request, key: string) => typeof req.params[key] === "string" ? req.params[key] : "";
const parsedId = (value: string) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const fail = (res: Response, error: unknown) => { const candidate = typeof error === "object" && error && ("statusCode" in error ? error.statusCode : "status" in error ? error.status : undefined); const status = typeof candidate === "number" && candidate >= 400 && candidate < 600 ? candidate : 500; console.error("Clinical request failed:", error); return res.status(status).json({ message: status === 500 ? "Server issue." : error instanceof Error ? error.message : "Request failed." }); };
const consentResponse = (consent: { id: number; patientId: number; type: ConsentType; status: ConsentStatus; updatedAt: Date }) => ({ id: String(consent.id), patientId: String(consent.patientId), type: Object.entries(consentTypes).find(([, value]) => value === consent.type)?.[0], status: consent.status === ConsentStatus.GRANTED ? "granted" : "revoked", timestamp: consent.updatedAt.toISOString() });

export async function grantConsent(req: Request, res: Response) {
  const patientId = parsedId(param(req, "id"));
  const requestedType = (req.body as { type?: unknown }).type;
  const type = typeof requestedType === "string" ? consentTypes[requestedType as keyof typeof consentTypes] : undefined;
  if (!patientId || !type) return res.status(400).json({ message: "A valid patient and consent type are required." });
  try { const consent = await prisma.consent.upsert({ where: { patientId_type: { patientId, type } }, create: { patientId, type }, update: { status: ConsentStatus.GRANTED } }); return res.status(201).json(consentResponse(consent)); } catch (error) { return fail(res, error); }
}

export async function revokeConsent(req: Request, res: Response) {
  const consentId = parsedId(param(req, "id")); if (!consentId) return res.status(400).json({ message: "A valid consent ID is required." });
  try { const consent = await prisma.consent.update({ where: { id: consentId }, data: { status: ConsentStatus.REVOKED } }); return res.json(consentResponse(consent)); } catch (error) { return fail(res, error); }
}

export async function generateSummary(req: Request, res: Response) {
  const body = req.body as { patientId?: unknown; interviewId?: unknown }; const patientId = Number(body.patientId);
  if (!Number.isInteger(patientId) || patientId < 1 || typeof body.interviewId !== "string") return res.status(400).json({ message: "A valid patientId and interviewId are required." });
  try { const summary = await generateClinicalSummary(patientId, body.interviewId); if (!summary) return res.status(404).json({ message: "Interview not found." }); return res.status(201).json(summaryResponse(summary)); } catch (error) { return fail(res, error); }
}

export async function getAlerts(_req: Request, res: Response) {
  try { const alerts = await prisma.triageAlert.findMany({ orderBy: { createdAt: "desc" } }); return res.json(alerts.map((alert) => ({ id: alert.id, interviewId: alert.interviewId, severity: alert.severity.toLowerCase(), message: alert.message, acknowledged: alert.acknowledged }))); } catch (error) { return fail(res, error); }
}

export async function acknowledgeAlert(req: Request, res: Response) {
  const alertId = param(req, "id");
  if (!alertId) return res.status(400).json({ message: "A valid alert ID is required." });
  try { const alert = await prisma.triageAlert.update({ where: { id: alertId }, data: { acknowledged: true, acknowledgedAt: new Date() } }); return res.json({ id: alert.id, interviewId: alert.interviewId, severity: alert.severity.toLowerCase(), message: alert.message, acknowledged: alert.acknowledged }); } catch (error) { return fail(res, error); }
}

export async function getTimeline(req: Request, res: Response) {
  const patientId = parsedId(param(req, "id")); if (!patientId) return res.status(400).json({ message: "A valid patient ID is required." });
  try { const entries = await prisma.timelineEntry.findMany({ where: { patientId }, orderBy: { occurredAt: "asc" } }); return res.json(entries.map((entry) => ({ date: entry.occurredAt.toISOString(), label: entry.label, source: entry.source === TimelineSource.DOCUMENT ? "document" : "interview" }))); } catch (error) { return fail(res, error); }
}

export async function getDoctorSummary(req: Request, res: Response) {
  const patientId = parsedId(param(req, "patientId")); if (!patientId) return res.status(400).json({ message: "A valid patient ID is required." });
  try { const summary = await prisma.clinicalSummary.findFirst({ where: { patientId }, orderBy: { updatedAt: "desc" }, include: { sections: true } }); if (!summary) return res.status(404).json({ message: "Summary not found." }); return res.json(summaryResponse(summary)); } catch (error) { return fail(res, error); }
}

export async function getStaffAssignments(_req: Request, res: Response) {
  try {
    const summaries = await prisma.clinicalSummary.findMany({
      where: { status: { not: SummaryStatus.APPROVED } },
      include: { patient: { select: { id: true, name: true } }, interview: { include: { alerts: { select: { severity: true } } } }, sections: { where: { section: SummarySectionType.CHIEF_COMPLAINT }, select: { content: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(summaries.map((summary) => ({ patientId: String(summary.patient.id), patientName: summary.patient.name, summaryId: summary.id, chiefComplaint: summary.sections[0]?.content ?? "Not reported", priority: summary.interview?.alerts.some((alert) => alert.severity === "CRITICAL") ? "critical" : "normal" })));
  } catch (error) { return fail(res, error); }
}

export async function updateSummary(req: Request, res: Response) {
  const body = req.body as { section?: keyof typeof sectionTypes; content?: unknown }; const type = body.section && sectionTypes[body.section];
  if (!type || typeof body.content !== "string") return res.status(400).json({ message: "A valid section and content are required." });
  const summaryId = param(req, "id");
  if (!summaryId) return res.status(400).json({ message: "A valid summary ID is required." });
  try { const existing = await prisma.clinicalSummary.findUnique({ where: { id: summaryId }, select: { status: true } }); if (!existing) return res.status(404).json({ message: "Summary not found." }); if (existing.status === SummaryStatus.APPROVED) return res.status(409).json({ message: "An approved summary cannot be edited." }); await prisma.clinicalSummary.update({ where: { id: summaryId }, data: { status: SummaryStatus.UNDER_REVIEW, sections: { upsert: { where: { summaryId_section: { summaryId, section: type } }, create: { section: type, content: body.content, aiGenerated: false, editedAt: new Date() }, update: { content: body.content, aiGenerated: false, editedAt: new Date() } } } } }); const summary = await prisma.clinicalSummary.findUniqueOrThrow({ where: { id: summaryId }, include: { sections: true } }); return res.json(summaryResponse(summary)); } catch (error) { return fail(res, error); }
}

export async function approveSummary(req: Request, res: Response) {
  const summaryId = param(req, "id");
  if (!summaryId) return res.status(400).json({ message: "A valid summary ID is required." });
  try { await prisma.clinicalSummary.update({ where: { id: summaryId }, data: { status: SummaryStatus.APPROVED, approvedAt: new Date() } }); const summary = await prisma.clinicalSummary.findUniqueOrThrow({ where: { id: summaryId }, include: { sections: true } }); return res.json(summaryResponse(summary)); } catch (error) { return fail(res, error); }
}
