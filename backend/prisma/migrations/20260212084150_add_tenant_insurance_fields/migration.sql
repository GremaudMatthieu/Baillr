-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "insurance_provider" TEXT,
ADD COLUMN     "policy_number" TEXT,
ADD COLUMN     "renewal_date" TIMESTAMP(3);
