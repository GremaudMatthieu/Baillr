-- CreateTable
CREATE TABLE "ownership_entities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT,
    "address_street" TEXT NOT NULL,
    "address_postal_code" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_country" TEXT NOT NULL DEFAULT 'France',
    "address_complement" TEXT,
    "legal_information" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownership_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ownership_entities_user_id_idx" ON "ownership_entities"("user_id");
