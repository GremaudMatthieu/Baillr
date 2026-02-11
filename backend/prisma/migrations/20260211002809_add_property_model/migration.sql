-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "address_street" TEXT NOT NULL,
    "address_postal_code" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_country" TEXT NOT NULL DEFAULT 'France',
    "address_complement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_entity_id_idx" ON "properties"("entity_id");

-- CreateIndex
CREATE INDEX "properties_user_id_idx" ON "properties"("user_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "ownership_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
