-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gocardless',
    "institution_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "agreement_expiry" TIMESTAMP(3) NOT NULL,
    "account_ids" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'linked',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_connections_entity_id_idx" ON "bank_connections"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_connections_bank_account_id_key" ON "bank_connections"("bank_account_id");

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
