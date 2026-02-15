-- CreateTable
CREATE TABLE "charge_regularizations" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "statements" JSONB NOT NULL DEFAULT '[]',
    "total_balance_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_regularizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charge_regularizations_entity_id_idx" ON "charge_regularizations"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "charge_regularizations_entity_id_fiscal_year_key" ON "charge_regularizations"("entity_id", "fiscal_year");
