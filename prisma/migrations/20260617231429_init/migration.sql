-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending', 'active', 'suspended', 'rejected', 'deactivated');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "DeliveryRequestStatus" AS ENUM ('draft', 'payment_initiated', 'payment_confirmed', 'created', 'marketplace_open', 'offers_received', 'provider_assigned', 'pickup_verified', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'initiated', 'pending', 'confirmed', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('open_marketplace', 'recommended_provider', 'search_provider', 'agency_dispatch');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('submitted', 'accepted', 'rejected', 'expired', 'withdrawn');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'unavailable', 'busy', 'offline');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('independent_rider', 'courier_company', 'logistics_company');

-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('pickup', 'delivery', 'phone_verification', 'payment_confirmation');

-- CreateEnum
CREATE TYPE "PaymentProviderStatus" AS ENUM ('initiated', 'pending', 'confirmed', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('held', 'released', 'refunded', 'disputed', 'partially_released');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('active', 'frozen', 'closed');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('credit', 'debit', 'payout', 'refund', 'commission', 'adjustment');

-- CreateEnum
CREATE TYPE "DispatchAssignmentStatus" AS ENUM ('suggested', 'assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "IdentityVerificationType" AS ENUM ('phone', 'national_id', 'profile', 'business_registration', 'agency_document', 'rider_identity');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('dashboard', 'whatsapp', 'email', 'sms');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('pickup_photo', 'package_photo', 'delivery_photo', 'delivery_confirmation', 'signature', 'other');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "avatar_file_id" UUID,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'pending',
    "phone_verified_at" TIMESTAMPTZ,
    "email_verified_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "agency_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "whatsapp_number" VARCHAR(32) NOT NULL,
    "payment_number" VARCHAR(32),
    "email" VARCHAR(255),
    "preferred_language" VARCHAR(16) DEFAULT 'en',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "legal_name" VARCHAR(220),
    "slug" VARCHAR(120),
    "description" TEXT,
    "phone" VARCHAR(32),
    "email" VARCHAR(255),
    "logo_file_id" UUID,
    "address" TEXT,
    "city" VARCHAR(120),
    "country" VARCHAR(120) DEFAULT 'Cameroon',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "subscription_status" VARCHAR(32) NOT NULL DEFAULT 'inactive',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_members" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "member_role" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "agency_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "agency_id" UUID,
    "provider_type" "ProviderType" NOT NULL,
    "display_name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "service_coverage" TEXT,
    "base_city" VARCHAR(120),
    "base_country" VARCHAR(120) DEFAULT 'Cameroon',
    "phone_number" VARCHAR(32),
    "business_address" TEXT,
    "business_lat" DECIMAL(10,7),
    "business_lng" DECIMAL(10,7),
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'available',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID,
    "agency_id" UUID,
    "delivery_type" VARCHAR(64),
    "base_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price_per_km" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price_per_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fragile_item_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "min_price" DECIMAL(12,2),
    "max_price" DECIMAL(12,2),
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_requests" (
    "id" UUID NOT NULL,
    "public_tracking_code" VARCHAR(40) NOT NULL,
    "customer_contact_id" UUID NOT NULL,
    "request_status" "DeliveryRequestStatus" NOT NULL DEFAULT 'draft',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "fulfillment_mode" "FulfillmentMode",
    "delivery_type" VARCHAR(64) NOT NULL,
    "expected_delivery_date" DATE,
    "expected_delivery_time" TIME,
    "selected_provider_profile_id" UUID,
    "selected_agency_id" UUID,
    "accepted_offer_id" UUID,
    "desired_reward_amount" DECIMAL(12,2),
    "delivery_cost" DECIMAL(12,2),
    "platform_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2),
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "payment_confirmed_at" TIMESTAMPTZ,
    "provider_assigned_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_routes" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "pickup_address" TEXT NOT NULL,
    "pickup_landmark" TEXT,
    "pickup_city" VARCHAR(120),
    "pickup_country" VARCHAR(120) DEFAULT 'Cameroon',
    "pickup_lat" DECIMAL(10,7),
    "pickup_lng" DECIMAL(10,7),
    "destination_address" TEXT NOT NULL,
    "destination_landmark" TEXT,
    "destination_city" VARCHAR(120),
    "destination_country" VARCHAR(120) DEFAULT 'Cameroon',
    "destination_lat" DECIMAL(10,7),
    "destination_lng" DECIMAL(10,7),
    "estimated_distance_km" DECIMAL(10,2),
    "estimated_duration_minutes" INTEGER,
    "suggested_route_summary" TEXT,
    "map_provider" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "request_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "item_name" VARCHAR(180) NOT NULL,
    "item_description" TEXT,
    "category" VARCHAR(100),
    "weight_kg" DECIMAL(10,2),
    "size_label" VARCHAR(64),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "photo_file_id" UUID,
    "is_fragile" BOOLEAN NOT NULL DEFAULT false,
    "special_instructions" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_selections" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "selection_mode" "FulfillmentMode" NOT NULL,
    "selected_provider_profile_id" UUID,
    "selected_agency_id" UUID,
    "estimated_min_price" DECIMAL(12,2),
    "estimated_max_price" DECIMAL(12,2),
    "final_price" DECIMAL(12,2),
    "recommendation_score" DECIMAL(8,4),
    "selection_metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "provider_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_offers" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "provider_profile_id" UUID,
    "agency_id" UUID,
    "offer_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "estimated_pickup_time" TIMESTAMPTZ,
    "estimated_delivery_time" TIMESTAMPTZ,
    "message" TEXT,
    "offer_status" "OfferStatus" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "expired_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "marketplace_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "status_after_event" VARCHAR(64),
    "responsible_user_id" UUID,
    "responsible_agency_id" UUID,
    "responsible_provider_profile_id" UUID,
    "notes" TEXT,
    "location_text" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "event_metadata" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "code_type" "VerificationCodeType" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "delivery_channel" VARCHAR(32),
    "recipient_phone" VARCHAR(32),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verified_at" TIMESTAMPTZ,
    "verified_by_user_id" UUID,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_records" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "proof_type" "ProofType" NOT NULL,
    "uploaded_by_user_id" UUID,
    "file_id" UUID,
    "notes" TEXT,
    "signature_text" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "proof_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "customer_contact_id" UUID NOT NULL,
    "payment_provider" VARCHAR(64) NOT NULL,
    "payment_method" VARCHAR(64) NOT NULL,
    "provider_reference" VARCHAR(160),
    "internal_reference" VARCHAR(160) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "payment_status" "PaymentProviderStatus" NOT NULL DEFAULT 'initiated',
    "payer_phone" VARCHAR(32) NOT NULL,
    "initiated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "raw_provider_response" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'held',
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "provider_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "held_at" TIMESTAMPTZ,
    "released_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "recipient_user_id" UUID,
    "recipient_agency_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "agency_id" UUID,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "available_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "wallet_status" "WalletStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "delivery_request_id" UUID,
    "escrow_transaction_id" UUID,
    "transaction_type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "balance_after" DECIMAL(12,2),
    "reference" VARCHAR(160),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riders" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "user_id" UUID,
    "full_name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "vehicle_type" VARCHAR(64),
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'available',
    "current_workload" INTEGER NOT NULL DEFAULT 0,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "last_known_lat" DECIMAL(10,7),
    "last_known_lng" DECIMAL(10,7),
    "last_seen_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_assignments" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "rider_id" UUID,
    "assignment_status" "DispatchAssignmentStatus" NOT NULL DEFAULT 'suggested',
    "assignment_score" DECIMAL(8,4),
    "assigned_by_user_id" UUID,
    "assigned_at" TIMESTAMPTZ,
    "accepted_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "dispatch_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_records" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "agency_id" UUID,
    "provider_profile_id" UUID,
    "rider_id" UUID,
    "verification_type" "IdentityVerificationType" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "document_file_id" UUID,
    "submitted_value" TEXT,
    "reviewer_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID,
    "recipient_customer_contact_id" UUID,
    "recipient_agency_id" UUID,
    "delivery_request_id" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "notification_type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(180),
    "message" TEXT NOT NULL,
    "destination" VARCHAR(180),
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "provider_reference" VARCHAR(160),
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_ratings" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "customer_contact_id" UUID NOT NULL,
    "provider_profile_id" UUID,
    "agency_id" UUID,
    "rider_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "review_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "delivery_request_id" UUID NOT NULL,
    "opened_by_user_id" UUID,
    "opened_by_customer_contact_id" UUID,
    "dispute_type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" UUID NOT NULL,
    "uploaded_by_user_id" UUID,
    "customer_contact_id" UUID,
    "storage_provider" VARCHAR(64) NOT NULL,
    "bucket_name" VARCHAR(160),
    "object_key" TEXT NOT NULL,
    "original_filename" VARCHAR(255),
    "mime_type" VARCHAR(120),
    "file_size_bytes" BIGINT,
    "visibility" VARCHAR(32) NOT NULL DEFAULT 'private',
    "checksum" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "delivery_type" VARCHAR(64),
    "provider_type" VARCHAR(64),
    "commission_type" "CommissionType" NOT NULL,
    "commission_value" DECIMAL(12,2) NOT NULL,
    "min_fee" DECIMAL(12,2),
    "max_fee" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMPTZ NOT NULL,
    "effective_to" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'XAF',
    "max_riders" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_subscriptions" (
    "id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "subscription_plan_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "agency_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_customer_contact_id" UUID,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "setting_key" VARCHAR(120) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_account_status" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_agency_id" ON "user_roles"("agency_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_agency_id_key" ON "user_roles"("user_id", "role_id", "agency_id");

-- CreateIndex
CREATE INDEX "idx_customer_contacts_whatsapp" ON "customer_contacts"("whatsapp_number");

-- CreateIndex
CREATE INDEX "idx_customer_contacts_email" ON "customer_contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE INDEX "idx_agencies_city" ON "agencies"("city");

-- CreateIndex
CREATE INDEX "idx_agencies_verification_status" ON "agencies"("verification_status");

-- CreateIndex
CREATE INDEX "idx_agencies_featured" ON "agencies"("is_featured");

-- CreateIndex
CREATE INDEX "idx_agency_members_agency_id" ON "agency_members"("agency_id");

-- CreateIndex
CREATE INDEX "idx_agency_members_user_id" ON "agency_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "agency_members_agency_id_user_id_key" ON "agency_members"("agency_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_provider_profiles_type" ON "provider_profiles"("provider_type");

-- CreateIndex
CREATE INDEX "idx_provider_profiles_city" ON "provider_profiles"("base_city");

-- CreateIndex
CREATE INDEX "idx_provider_profiles_rating" ON "provider_profiles"("rating_average");

-- CreateIndex
CREATE INDEX "idx_provider_profiles_verification" ON "provider_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "idx_provider_profiles_featured" ON "provider_profiles"("is_featured");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_provider" ON "pricing_rules"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_agency" ON "pricing_rules"("agency_id");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_delivery_type" ON "pricing_rules"("delivery_type");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_active" ON "pricing_rules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_requests_public_tracking_code_key" ON "delivery_requests"("public_tracking_code");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_requests_accepted_offer_id_key" ON "delivery_requests"("accepted_offer_id");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_customer" ON "delivery_requests"("customer_contact_id");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_status" ON "delivery_requests"("request_status");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_payment_status" ON "delivery_requests"("payment_status");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_fulfillment_mode" ON "delivery_requests"("fulfillment_mode");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_delivery_type" ON "delivery_requests"("delivery_type");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_expected_date" ON "delivery_requests"("expected_delivery_date");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_selected_provider" ON "delivery_requests"("selected_provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_selected_agency" ON "delivery_requests"("selected_agency_id");

-- CreateIndex
CREATE INDEX "idx_delivery_requests_created_at" ON "delivery_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_routes_delivery_request_id_key" ON "request_routes"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_request_routes_pickup_city" ON "request_routes"("pickup_city");

-- CreateIndex
CREATE INDEX "idx_request_routes_destination_city" ON "request_routes"("destination_city");

-- CreateIndex
CREATE INDEX "idx_request_items_request" ON "request_items"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_request_items_category" ON "request_items"("category");

-- CreateIndex
CREATE INDEX "idx_request_items_fragile" ON "request_items"("is_fragile");

-- CreateIndex
CREATE UNIQUE INDEX "provider_selections_delivery_request_id_key" ON "provider_selections"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_provider_selections_mode" ON "provider_selections"("selection_mode");

-- CreateIndex
CREATE INDEX "idx_provider_selections_provider" ON "provider_selections"("selected_provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_provider_selections_agency" ON "provider_selections"("selected_agency_id");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_request" ON "marketplace_offers"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_status" ON "marketplace_offers"("offer_status");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_amount" ON "marketplace_offers"("offer_amount");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_provider" ON "marketplace_offers"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_agency" ON "marketplace_offers"("agency_id");

-- CreateIndex
CREATE INDEX "idx_marketplace_offers_submitted_at" ON "marketplace_offers"("submitted_at");

-- CreateIndex
CREATE INDEX "idx_tracking_events_request" ON "tracking_events"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_tracking_events_type" ON "tracking_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_tracking_events_occurred_at" ON "tracking_events"("occurred_at");

-- CreateIndex
CREATE INDEX "idx_verification_codes_request" ON "verification_codes"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_verification_codes_type" ON "verification_codes"("code_type");

-- CreateIndex
CREATE INDEX "idx_verification_codes_expires_at" ON "verification_codes"("expires_at");

-- CreateIndex
CREATE INDEX "idx_verification_codes_verified_at" ON "verification_codes"("verified_at");

-- CreateIndex
CREATE INDEX "idx_proof_records_request" ON "proof_records"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_proof_records_type" ON "proof_records"("proof_type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_internal_reference_key" ON "payments"("internal_reference");

-- CreateIndex
CREATE INDEX "idx_payments_request" ON "payments"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_payments_customer" ON "payments"("customer_contact_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "idx_payments_provider_reference" ON "payments"("provider_reference");

-- CreateIndex
CREATE INDEX "idx_payments_created_at" ON "payments"("created_at");

-- CreateIndex
CREATE INDEX "idx_escrow_request" ON "escrow_transactions"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_escrow_payment" ON "escrow_transactions"("payment_id");

-- CreateIndex
CREATE INDEX "idx_escrow_status" ON "escrow_transactions"("escrow_status");

-- CreateIndex
CREATE INDEX "idx_escrow_recipient_user" ON "escrow_transactions"("recipient_user_id");

-- CreateIndex
CREATE INDEX "idx_escrow_recipient_agency" ON "escrow_transactions"("recipient_agency_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_reference_key" ON "wallet_transactions"("reference");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_wallet" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_request" ON "wallet_transactions"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_type" ON "wallet_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_created_at" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_riders_agency" ON "riders"("agency_id");

-- CreateIndex
CREATE INDEX "idx_riders_availability" ON "riders"("availability_status");

-- CreateIndex
CREATE INDEX "idx_riders_vehicle_type" ON "riders"("vehicle_type");

-- CreateIndex
CREATE INDEX "idx_riders_verification" ON "riders"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "riders_agency_id_phone_key" ON "riders"("agency_id", "phone");

-- CreateIndex
CREATE INDEX "idx_dispatch_request" ON "dispatch_assignments"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_dispatch_agency" ON "dispatch_assignments"("agency_id");

-- CreateIndex
CREATE INDEX "idx_dispatch_rider" ON "dispatch_assignments"("rider_id");

-- CreateIndex
CREATE INDEX "idx_dispatch_status" ON "dispatch_assignments"("assignment_status");

-- CreateIndex
CREATE INDEX "idx_verification_user" ON "verification_records"("user_id");

-- CreateIndex
CREATE INDEX "idx_verification_agency" ON "verification_records"("agency_id");

-- CreateIndex
CREATE INDEX "idx_verification_provider" ON "verification_records"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_verification_status" ON "verification_records"("status");

-- CreateIndex
CREATE INDEX "idx_verification_type" ON "verification_records"("verification_type");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("recipient_user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_customer" ON "notifications"("recipient_customer_contact_id");

-- CreateIndex
CREATE INDEX "idx_notifications_agency" ON "notifications"("recipient_agency_id");

-- CreateIndex
CREATE INDEX "idx_notifications_request" ON "notifications"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_notifications_channel" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_reviews_request" ON "review_ratings"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_reviews_provider" ON "review_ratings"("provider_profile_id");

-- CreateIndex
CREATE INDEX "idx_reviews_agency" ON "review_ratings"("agency_id");

-- CreateIndex
CREATE INDEX "idx_reviews_rating" ON "review_ratings"("rating");

-- CreateIndex
CREATE INDEX "idx_disputes_request" ON "disputes"("delivery_request_id");

-- CreateIndex
CREATE INDEX "idx_disputes_status" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "idx_disputes_type" ON "disputes"("dispute_type");

-- CreateIndex
CREATE INDEX "idx_uploaded_files_user" ON "uploaded_files"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "idx_uploaded_files_customer" ON "uploaded_files"("customer_contact_id");

-- CreateIndex
CREATE INDEX "idx_uploaded_files_visibility" ON "uploaded_files"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "idx_agency_subscriptions_agency" ON "agency_subscriptions"("agency_id");

-- CreateIndex
CREATE INDEX "idx_agency_subscriptions_status" ON "agency_subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_user" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_customer_contact_id_fkey" FOREIGN KEY ("customer_contact_id") REFERENCES "customer_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_selected_provider_profile_id_fkey" FOREIGN KEY ("selected_provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_accepted_offer_id_fkey" FOREIGN KEY ("accepted_offer_id") REFERENCES "marketplace_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_routes" ADD CONSTRAINT "request_routes_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_selections" ADD CONSTRAINT "provider_selections_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_responsible_provider_profile_id_fkey" FOREIGN KEY ("responsible_provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_records" ADD CONSTRAINT "proof_records_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_contact_id_fkey" FOREIGN KEY ("customer_contact_id") REFERENCES "customer_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_assignments" ADD CONSTRAINT "dispatch_assignments_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_customer_contact_id_fkey" FOREIGN KEY ("recipient_customer_contact_id") REFERENCES "customer_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_agency_id_fkey" FOREIGN KEY ("recipient_agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_delivery_request_id_fkey" FOREIGN KEY ("delivery_request_id") REFERENCES "delivery_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_customer_contact_id_fkey" FOREIGN KEY ("customer_contact_id") REFERENCES "customer_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_subscriptions" ADD CONSTRAINT "agency_subscriptions_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_subscriptions" ADD CONSTRAINT "agency_subscriptions_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_customer_contact_id_fkey" FOREIGN KEY ("actor_customer_contact_id") REFERENCES "customer_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
