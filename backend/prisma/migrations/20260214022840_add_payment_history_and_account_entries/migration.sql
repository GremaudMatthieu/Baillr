-- AlterTable
ALTER TABLE "rent_calls" ADD COLUMN     "overpayment_cents" INTEGER,
ADD COLUMN     "payment_status" TEXT,
ADD COLUMN     "remaining_balance_cents" INTEGER;

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "rent_call_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "bank_statement_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "payer_name" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_reference" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_entries" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "balance_cents" INTEGER NOT NULL,
    "reference_id" TEXT NOT NULL,
    "reference_month" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_rent_call_id_idx" ON "payments"("rent_call_id");

-- CreateIndex
CREATE INDEX "payments_entity_id_idx" ON "payments"("entity_id");

-- CreateIndex
CREATE INDEX "account_entries_entity_id_tenant_id_idx" ON "account_entries"("entity_id", "tenant_id");

-- CreateIndex
CREATE INDEX "account_entries_tenant_id_idx" ON "account_entries"("tenant_id");

-- CreateIndex (unique constraint for idempotent payment projection)
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex (unique constraint for idempotent account entry projection)
CREATE UNIQUE INDEX "account_entries_reference_id_category_key" ON "account_entries"("reference_id", "category");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rent_call_id_fkey" FOREIGN KEY ("rent_call_id") REFERENCES "rent_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
