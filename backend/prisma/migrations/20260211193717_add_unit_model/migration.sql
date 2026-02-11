-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "floor" INTEGER,
    "surface_area" DOUBLE PRECISION NOT NULL,
    "billable_options" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "units_property_id_idx" ON "units"("property_id");

-- CreateIndex
CREATE INDEX "units_user_id_idx" ON "units"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_property_id_identifier_key" ON "units"("property_id", "identifier");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
