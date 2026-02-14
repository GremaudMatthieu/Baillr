-- AlterTable
ALTER TABLE "rent_calls" ADD COLUMN     "bank_statement_id" TEXT,
ADD COLUMN     "paid_amount_cents" INTEGER,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payer_name" TEXT,
ADD COLUMN     "payment_date" TIMESTAMP(3),
ADD COLUMN     "transaction_id" TEXT;
