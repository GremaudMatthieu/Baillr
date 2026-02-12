-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "base_index_value" DOUBLE PRECISION,
ADD COLUMN     "reference_quarter" TEXT,
ADD COLUMN     "reference_year" INTEGER,
ADD COLUMN     "revision_day" INTEGER,
ADD COLUMN     "revision_month" INTEGER;
