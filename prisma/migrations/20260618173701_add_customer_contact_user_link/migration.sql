-- AlterTable
ALTER TABLE "customer_contacts" ADD COLUMN     "user_id" UUID;

-- CreateIndex
CREATE INDEX "idx_customer_contacts_user_id" ON "customer_contacts"("user_id");

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
