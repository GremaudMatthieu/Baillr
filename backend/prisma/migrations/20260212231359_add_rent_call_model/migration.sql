-- CreateTable
CREATE TABLE "rent_calls" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "rent_amount_cents" INTEGER NOT NULL,
    "billing_lines" JSONB NOT NULL DEFAULT '[]',
    "total_amount_cents" INTEGER NOT NULL,
    "is_pro_rata" BOOLEAN NOT NULL DEFAULT false,
    "occupied_days" INTEGER,
    "total_days_in_month" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rent_calls_entity_id_idx" ON "rent_calls"("entity_id");

-- CreateIndex
CREATE INDEX "rent_calls_user_id_idx" ON "rent_calls"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rent_calls_lease_id_month_key" ON "rent_calls"("lease_id", "month");

-- AddForeignKey
ALTER TABLE "rent_calls" ADD CONSTRAINT "rent_calls_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_calls" ADD CONSTRAINT "rent_calls_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_calls" ADD CONSTRAINT "rent_calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_calls" ADD CONSTRAINT "rent_calls_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
