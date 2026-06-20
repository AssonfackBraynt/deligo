/*
  Warnings:

  - You are about to drop the column `destination_address` on the `request_routes` table. All the data in the column will be lost.
  - You are about to drop the column `destination_city` on the `request_routes` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_address` on the `request_routes` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_city` on the `request_routes` table. All the data in the column will be lost.
  - Added the required column `destination_quarter_id` to the `request_routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickup_quarter_id` to the `request_routes` table without a default value. This is not possible if the table is not empty.
  - Made the column `pickup_landmark` on table `request_routes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `destination_landmark` on table `request_routes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "idx_request_routes_destination_city";

-- DropIndex
DROP INDEX "idx_request_routes_pickup_city";

-- AlterTable
ALTER TABLE "request_routes" DROP COLUMN "destination_address",
DROP COLUMN "destination_city",
DROP COLUMN "pickup_address",
DROP COLUMN "pickup_city",
ADD COLUMN     "destination_quarter_id" UUID NOT NULL,
ADD COLUMN     "pickup_quarter_id" UUID NOT NULL,
ALTER COLUMN "pickup_landmark" SET NOT NULL,
ALTER COLUMN "destination_landmark" SET NOT NULL;

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "towns" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "towns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarters" (
    "id" UUID NOT NULL,
    "town_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quarters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE INDEX "idx_towns_region_id" ON "towns"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "towns_region_id_name_key" ON "towns"("region_id", "name");

-- CreateIndex
CREATE INDEX "idx_quarters_town_id" ON "quarters"("town_id");

-- CreateIndex
CREATE UNIQUE INDEX "quarters_town_id_name_key" ON "quarters"("town_id", "name");

-- CreateIndex
CREATE INDEX "idx_request_routes_pickup_quarter" ON "request_routes"("pickup_quarter_id");

-- CreateIndex
CREATE INDEX "idx_request_routes_destination_quarter" ON "request_routes"("destination_quarter_id");

-- AddForeignKey
ALTER TABLE "towns" ADD CONSTRAINT "towns_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarters" ADD CONSTRAINT "quarters_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_routes" ADD CONSTRAINT "request_routes_pickup_quarter_id_fkey" FOREIGN KEY ("pickup_quarter_id") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_routes" ADD CONSTRAINT "request_routes_destination_quarter_id_fkey" FOREIGN KEY ("destination_quarter_id") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
