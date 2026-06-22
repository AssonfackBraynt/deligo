-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN     "price_in_region" DECIMAL(12,2),
ADD COLUMN     "price_in_town" DECIMAL(12,2);
