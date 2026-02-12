-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "billing_lines" JSONB NOT NULL DEFAULT '[]';
