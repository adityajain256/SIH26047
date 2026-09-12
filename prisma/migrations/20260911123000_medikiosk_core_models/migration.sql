-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('HISTORY_COLLECTION', 'DOCUMENT_PROCESSING', 'DATA_SHARING');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "IntakeMode" AS ENUM ('GENERAL', 'AYUSH');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('CHIEF_COMPLAINT', 'HPI', 'PAST_MEDICAL_HISTORY', 'SURGICAL_HISTORY', 'MEDICATIONS', 'ALLERGIES', 'FAMILY_HISTORY', 'PERSONAL_HISTORY', 'REVIEW_OF_SYSTEMS', 'DOCUMENT_UPLOAD', 'SUMMARY_GENERATION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "SummarySectionType" AS ENUM ('CHIEF_COMPLAINT', 'HPI', 'PAST_MEDICAL_HISTORY', 'PAST_SURGICAL_HISTORY', 'MEDICATIONS', 'ALLERGIES', 'FAMILY_HISTORY', 'PERSONAL_HISTORY', 'REVIEW_OF_SYSTEMS');

-- CreateEnum
CREATE TYPE "QueuePriority" AS ENUM ('NORMAL', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'DIAGNOSED');

-- CreateEnum
CREATE TYPE "TimelineSource" AS ENUM ('INTERVIEW', 'DOCUMENT', 'SUMMARY');

-- CreateEnum
CREATE TYPE "MedicalHistoryCategory" AS ENUM ('CONDITION', 'SURGERY', 'MEDICATION', 'ALLERGY', 'FAMILY', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('PATIENT_REGISTRATION', 'PATIENT_CHECK_IN', 'STAFF_REGISTRATION', 'DOCTOR_REGISTRATION');

-- AlterTable
ALTER TABLE "Consent" DROP COLUMN "dataSharing",
DROP COLUMN "historyCollection",
DROP COLUMN "historySharing",
ADD COLUMN     "type" "ConsentType" NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConsentStatus" NOT NULL DEFAULT 'GRANTED';

-- AlterTable
ALTER TABLE "MedicalHistory" ADD COLUMN     "category" "MedicalHistoryCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "medikioskId" TEXT,
ADD COLUMN     "otpVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredByStaffId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "doctorCode" TEXT,
ADD COLUMN     "governmentId" TEXT,
ADD COLUMN     "hospitalPosting" TEXT,
ADD COLUMN     "staffCode" TEXT;

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "createdByStaffId" INTEGER,
    "mode" "IntakeMode" NOT NULL,
    "language" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStage" "InterviewStage" NOT NULL DEFAULT 'CHIEF_COMPLAINT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnswer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "stage" "InterviewStage" NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "spokenTranscript" TEXT,
    "translatedAnswer" TEXT,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageAlert" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedById" INTEGER,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalDocument" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "interviewId" TEXT,
    "uploadedById" INTEGER,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractedData" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalSummary" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "interviewId" TEXT,
    "mode" "IntakeMode" NOT NULL,
    "status" "SummaryStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummarySection" (
    "id" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "section" "SummarySectionType" NOT NULL,
    "content" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummarySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyushAssessment" (
    "id" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "prakriti" TEXT,
    "vikriti" TEXT,
    "agni" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AyushAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorQueueItem" (
    "id" TEXT NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "summaryId" TEXT NOT NULL,
    "assignedByStaffId" INTEGER,
    "priority" "QueuePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "diagnosis" TEXT,
    "diagnosisAttachmentName" TEXT,
    "diagnosisAttachmentKey" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosedAt" TIMESTAMP(3),

    CONSTRAINT "DoctorQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDoctorFavorite" (
    "staffId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffDoctorFavorite_pkey" PRIMARY KEY ("staffId","doctorId")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "interviewId" TEXT,
    "documentId" TEXT,
    "summaryId" TEXT,
    "label" TEXT NOT NULL,
    "source" "TimelineSource" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationChallenge" (
    "id" TEXT NOT NULL,
    "patientId" INTEGER,
    "userId" INTEGER,
    "channel" "VerificationChannel" NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" INTEGER,
    "patientId" INTEGER,
    "interviewId" TEXT,
    "summaryId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_patientId_status_idx" ON "Interview"("patientId", "status");

-- CreateIndex
CREATE INDEX "Interview_createdByStaffId_idx" ON "Interview"("createdByStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnswer_interviewId_stage_key" ON "InterviewAnswer"("interviewId", "stage");

-- CreateIndex
CREATE INDEX "TriageAlert_patientId_acknowledged_idx" ON "TriageAlert"("patientId", "acknowledged");

-- CreateIndex
CREATE INDEX "TriageAlert_interviewId_idx" ON "TriageAlert"("interviewId");

-- CreateIndex
CREATE INDEX "TriageAlert_acknowledgedById_idx" ON "TriageAlert"("acknowledgedById");

-- CreateIndex
CREATE INDEX "MedicalDocument_patientId_status_idx" ON "MedicalDocument"("patientId", "status");

-- CreateIndex
CREATE INDEX "MedicalDocument_interviewId_idx" ON "MedicalDocument"("interviewId");

-- CreateIndex
CREATE INDEX "MedicalDocument_uploadedById_idx" ON "MedicalDocument"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalSummary_interviewId_key" ON "ClinicalSummary"("interviewId");

-- CreateIndex
CREATE INDEX "ClinicalSummary_patientId_status_idx" ON "ClinicalSummary"("patientId", "status");

-- CreateIndex
CREATE INDEX "ClinicalSummary_approvedById_idx" ON "ClinicalSummary"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "SummarySection_summaryId_section_key" ON "SummarySection"("summaryId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "AyushAssessment_summaryId_key" ON "AyushAssessment"("summaryId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorQueueItem_summaryId_key" ON "DoctorQueueItem"("summaryId");

-- CreateIndex
CREATE INDEX "DoctorQueueItem_doctorId_priority_status_idx" ON "DoctorQueueItem"("doctorId", "priority", "status");

-- CreateIndex
CREATE INDEX "DoctorQueueItem_patientId_idx" ON "DoctorQueueItem"("patientId");

-- CreateIndex
CREATE INDEX "DoctorQueueItem_assignedByStaffId_idx" ON "DoctorQueueItem"("assignedByStaffId");

-- CreateIndex
CREATE INDEX "StaffDoctorFavorite_doctorId_idx" ON "StaffDoctorFavorite"("doctorId");

-- CreateIndex
CREATE INDEX "TimelineEntry_patientId_occurredAt_idx" ON "TimelineEntry"("patientId", "occurredAt");

-- CreateIndex
CREATE INDEX "TimelineEntry_interviewId_idx" ON "TimelineEntry"("interviewId");

-- CreateIndex
CREATE INDEX "TimelineEntry_documentId_idx" ON "TimelineEntry"("documentId");

-- CreateIndex
CREATE INDEX "TimelineEntry_summaryId_idx" ON "TimelineEntry"("summaryId");

-- CreateIndex
CREATE INDEX "VerificationChallenge_patientId_purpose_idx" ON "VerificationChallenge"("patientId", "purpose");

-- CreateIndex
CREATE INDEX "VerificationChallenge_userId_purpose_idx" ON "VerificationChallenge"("userId", "purpose");

-- CreateIndex
CREATE INDEX "AuditEvent_patientId_createdAt_idx" ON "AuditEvent"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_interviewId_idx" ON "AuditEvent"("interviewId");

-- CreateIndex
CREATE INDEX "AuditEvent_summaryId_idx" ON "AuditEvent"("summaryId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_patientId_type_key" ON "Consent"("patientId", "type");

-- CreateIndex
CREATE INDEX "MedicalHistory_patientId_idx" ON "MedicalHistory"("patientId");

-- CreateIndex
CREATE INDEX "MedicalHistory_userId_idx" ON "MedicalHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_medikioskId_key" ON "Patient"("medikioskId");

-- CreateIndex
CREATE INDEX "Patient_registeredByStaffId_idx" ON "Patient"("registeredByStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "User_governmentId_key" ON "User"("governmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_doctorCode_key" ON "User"("doctorCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffCode_key" ON "User"("staffCode");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_registeredByStaffId_fkey" FOREIGN KEY ("registeredByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAlert" ADD CONSTRAINT "TriageAlert_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAlert" ADD CONSTRAINT "TriageAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAlert" ADD CONSTRAINT "TriageAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSummary" ADD CONSTRAINT "ClinicalSummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSummary" ADD CONSTRAINT "ClinicalSummary_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalSummary" ADD CONSTRAINT "ClinicalSummary_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummarySection" ADD CONSTRAINT "SummarySection_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ClinicalSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyushAssessment" ADD CONSTRAINT "AyushAssessment_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ClinicalSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorQueueItem" ADD CONSTRAINT "DoctorQueueItem_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorQueueItem" ADD CONSTRAINT "DoctorQueueItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorQueueItem" ADD CONSTRAINT "DoctorQueueItem_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ClinicalSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorQueueItem" ADD CONSTRAINT "DoctorQueueItem_assignedByStaffId_fkey" FOREIGN KEY ("assignedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDoctorFavorite" ADD CONSTRAINT "StaffDoctorFavorite_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDoctorFavorite" ADD CONSTRAINT "StaffDoctorFavorite_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MedicalDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ClinicalSummary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationChallenge" ADD CONSTRAINT "VerificationChallenge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationChallenge" ADD CONSTRAINT "VerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "ClinicalSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
