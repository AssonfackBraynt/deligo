-- AlterTable
ALTER TABLE "uploaded_files" ADD COLUMN     "document_purpose" VARCHAR(64),
ADD COLUMN     "encryption_iv" VARCHAR(64),
ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider_profile_id" UUID,
ADD COLUMN     "storage_url" TEXT;

-- AlterTable
ALTER TABLE "verification_records" ADD COLUMN     "approval_notes" TEXT,
ADD COLUMN     "expires_at" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "idx_uploaded_files_provider" ON "uploaded_files"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_uploaded_files_purpose" ON "uploaded_files"("document_purpose");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
