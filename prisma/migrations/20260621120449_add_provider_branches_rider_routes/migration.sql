-- CreateTable
CREATE TABLE "provider_branches" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "quarter_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "phone_number" VARCHAR(32),
    "is_headquarters" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "provider_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_routes" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "origin_quarter_id" UUID NOT NULL,
    "destination_quarter_id" UUID NOT NULL,
    "departure_time" VARCHAR(8),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_days" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "rider_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_provider_branches_profile" ON "provider_branches"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_provider_branches_quarter" ON "provider_branches"("quarter_id");

-- CreateIndex
CREATE INDEX "idx_rider_routes_profile" ON "rider_routes"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_rider_routes_origin" ON "rider_routes"("origin_quarter_id");

-- CreateIndex
CREATE INDEX "idx_rider_routes_destination" ON "rider_routes"("destination_quarter_id");

-- CreateIndex
CREATE INDEX "idx_rider_routes_active" ON "rider_routes"("is_active");

-- AddForeignKey
ALTER TABLE "provider_branches" ADD CONSTRAINT "provider_branches_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_branches" ADD CONSTRAINT "provider_branches_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_routes" ADD CONSTRAINT "rider_routes_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_routes" ADD CONSTRAINT "rider_routes_origin_quarter_id_fkey" FOREIGN KEY ("origin_quarter_id") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_routes" ADD CONSTRAINT "rider_routes_destination_quarter_id_fkey" FOREIGN KEY ("destination_quarter_id") REFERENCES "quarters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
