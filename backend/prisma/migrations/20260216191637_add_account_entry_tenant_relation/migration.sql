-- AddForeignKey
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
