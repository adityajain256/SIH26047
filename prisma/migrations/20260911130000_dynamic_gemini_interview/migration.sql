-- DropIndex
DROP INDEX "InterviewAnswer_interviewId_stage_key";

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "pendingQuestionId" TEXT NOT NULL DEFAULT 'chief_complaint',
ADD COLUMN     "pendingQuestionText" TEXT NOT NULL DEFAULT 'What brings you in today?',
ADD COLUMN     "questionIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnswer_interviewId_questionId_key" ON "InterviewAnswer"("interviewId", "questionId");
