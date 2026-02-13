-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "transaction_count" INTEGER NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "bank_statement_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "payer_name" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_entity_id_idx" ON "bank_statements"("entity_id");

-- CreateIndex
CREATE INDEX "bank_statements_user_id_idx" ON "bank_statements"("user_id");

-- CreateIndex
CREATE INDEX "bank_transactions_bank_statement_id_idx" ON "bank_transactions"("bank_statement_id");

-- CreateIndex
CREATE INDEX "bank_transactions_entity_id_idx" ON "bank_transactions"("entity_id");

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_statement_id_fkey" FOREIGN KEY ("bank_statement_id") REFERENCES "bank_statements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
