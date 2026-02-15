/*
  Warnings:

  - You are about to drop the column `billing_lines` on the `leases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leases" DROP COLUMN "billing_lines";

-- AlterTable
ALTER TABLE "ownership_entities" ADD COLUMN     "late_payment_delay_days" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "rent_call_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tier1_sent_at" TIMESTAMP(3),
    "tier1_recipient_email" TEXT,
    "tier2_sent_at" TIMESTAMP(3),
    "tier3_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insee_indices" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insee_indices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "unit_label" TEXT NOT NULL,
    "current_rent_cents" INTEGER NOT NULL,
    "new_rent_cents" INTEGER NOT NULL,
    "difference_cents" INTEGER NOT NULL,
    "base_index_value" DOUBLE PRECISION NOT NULL,
    "base_index_quarter" TEXT NOT NULL,
    "base_index_year" INTEGER,
    "new_index_value" DOUBLE PRECISION NOT NULL,
    "new_index_quarter" TEXT NOT NULL,
    "new_index_year" INTEGER NOT NULL,
    "revision_index_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_charges" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "charges" JSONB NOT NULL DEFAULT '[]',
    "total_amount_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_categories" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_standard" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_billing_lines" (
    "id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "charge_category_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_billing_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_meter_readings" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "readings" JSONB NOT NULL DEFAULT '[]',
    "total_consumption" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_meter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escalations_rent_call_id_key" ON "escalations"("rent_call_id");

-- CreateIndex
CREATE INDEX "escalations_entity_id_idx" ON "escalations"("entity_id");

-- CreateIndex
CREATE INDEX "escalations_user_id_idx" ON "escalations"("user_id");

-- CreateIndex
CREATE INDEX "insee_indices_entity_id_idx" ON "insee_indices"("entity_id");

-- CreateIndex
CREATE INDEX "insee_indices_user_id_idx" ON "insee_indices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "insee_indices_type_quarter_year_entity_id_key" ON "insee_indices"("type", "quarter", "year", "entity_id");

-- CreateIndex
CREATE INDEX "revisions_entity_id_idx" ON "revisions"("entity_id");

-- CreateIndex
CREATE INDEX "revisions_lease_id_idx" ON "revisions"("lease_id");

-- CreateIndex
CREATE UNIQUE INDEX "revisions_lease_id_new_index_year_new_index_quarter_key" ON "revisions"("lease_id", "new_index_year", "new_index_quarter");

-- CreateIndex
CREATE INDEX "annual_charges_entity_id_idx" ON "annual_charges"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "annual_charges_entity_id_fiscal_year_key" ON "annual_charges"("entity_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "charge_categories_entity_id_idx" ON "charge_categories"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "charge_categories_entity_id_slug_key" ON "charge_categories"("entity_id", "slug");

-- CreateIndex
CREATE INDEX "lease_billing_lines_lease_id_idx" ON "lease_billing_lines"("lease_id");

-- CreateIndex
CREATE INDEX "lease_billing_lines_charge_category_id_idx" ON "lease_billing_lines"("charge_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "lease_billing_lines_lease_id_charge_category_id_key" ON "lease_billing_lines"("lease_id", "charge_category_id");

-- CreateIndex
CREATE INDEX "water_meter_readings_entity_id_idx" ON "water_meter_readings"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "water_meter_readings_entity_id_fiscal_year_key" ON "water_meter_readings"("entity_id", "fiscal_year");

-- AddForeignKey
ALTER TABLE "charge_categories" ADD CONSTRAINT "charge_categories_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_billing_lines" ADD CONSTRAINT "lease_billing_lines_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_billing_lines" ADD CONSTRAINT "lease_billing_lines_charge_category_id_fkey" FOREIGN KEY ("charge_category_id") REFERENCES "charge_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
