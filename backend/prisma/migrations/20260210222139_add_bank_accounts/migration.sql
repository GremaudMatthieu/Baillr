-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "iban" TEXT,
    "bic" TEXT,
    "bank_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_entity_id_idx" ON "bank_accounts"("entity_id");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
