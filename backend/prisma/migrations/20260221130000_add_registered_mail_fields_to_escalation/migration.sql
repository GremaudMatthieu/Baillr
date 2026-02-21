-- AlterTable
ALTER TABLE "escalations" ADD COLUMN "registered_mail_tracking_id" TEXT,
ADD COLUMN "registered_mail_provider" TEXT,
ADD COLUMN "registered_mail_cost_cents" INTEGER,
ADD COLUMN "registered_mail_dispatched_at" TIMESTAMP(3),
ADD COLUMN "registered_mail_status" TEXT,
ADD COLUMN "registered_mail_proof_url" TEXT;

-- CreateIndex
CREATE INDEX "escalations_registered_mail_tracking_id_idx" ON "escalations"("registered_mail_tracking_id");
