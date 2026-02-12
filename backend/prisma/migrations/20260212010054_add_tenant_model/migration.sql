-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company_name" TEXT,
    "siret" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "address_street" TEXT,
    "address_postal_code" TEXT,
    "address_city" TEXT,
    "address_complement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenants_entity_id_idx" ON "tenants"("entity_id");

-- CreateIndex
CREATE INDEX "tenants_user_id_idx" ON "tenants"("user_id");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
