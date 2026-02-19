-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_logs" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_preferences_entity_id_idx" ON "alert_preferences"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_entity_id_user_id_alert_type_key" ON "alert_preferences"("entity_id", "user_id", "alert_type");

-- CreateIndex
CREATE INDEX "alert_logs_entity_id_idx" ON "alert_logs"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_logs_entity_id_user_id_alert_type_reference_id_key" ON "alert_logs"("entity_id", "user_id", "alert_type", "reference_id");
