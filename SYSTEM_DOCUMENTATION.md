# DeliGo — Complete System Documentation

**Version:** Phase 3  
**Prepared by:** Engineering  
**Last updated:** 2026-06-21  
**Purpose:** Technical reference for diagram generation and formal documentation report

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context and Target Market](#2-business-context-and-target-market)
3. [Technology Stack](#3-technology-stack)
4. [High-Level System Architecture](#4-high-level-system-architecture)
5. [Backend Architecture — NestJS](#5-backend-architecture--nestjs)
6. [Database Design](#6-database-design)
7. [API Reference](#7-api-reference)
8. [Frontend Architecture — Next.js 15](#8-frontend-architecture--nextjs-15)
9. [Key Business Flows](#9-key-business-flows)
10. [Security Architecture](#10-security-architecture)
11. [Intelligence Layer](#11-intelligence-layer)
12. [File Upload and Storage System](#12-file-upload-and-storage-system)
13. [Real-Time Tracking (SSE)](#13-real-time-tracking-sse)
14. [Financial Architecture](#14-financial-architecture)
15. [Notification System](#15-notification-system)
16. [Environment Configuration](#16-environment-configuration)
17. [Database Migrations](#17-database-migrations)
18. [Deployment Topology](#18-deployment-topology)

---

## 1. Executive Summary

DeliGo is a logistics coordination SaaS platform built specifically for the Cameroonian market. It connects customers who need parcels, documents, food, or goods moved across cities with a network of verified delivery providers — independent motorcycle riders, courier companies, and logistics companies.

Customers do not need to create an account. They post a delivery request, choose a provider, and track their parcel in real time using a public tracking code (e.g., `DLG-RH7N9N`). Providers register, undergo an identity verification process, and receive jobs either through open marketplace bidding, direct assignment by the customer, or smart algorithm-based recommendation.

The system is built as a monorepo containing a NestJS REST API backend and a Next.js 15 frontend, backed by a PostgreSQL database and Supabase Storage for encrypted document uploads.

---

## 2. Business Context and Target Market

### Target Geography
- Primary: Cameroon (cities: Douala, Yaoundé, Bafoussam, Bamenda)
- Currency: XAF (Central African CFA franc)
- Phone format: Cameroonian numbers (9-digit, +237 prefix)
- Language: French / English bilingual

### Actor Types

| Actor | Description |
|---|---|
| Customer (anonymous) | Posts a delivery request with no account. Identified by a CustomerContact record (WhatsApp, name). |
| Customer (authenticated) | Same as anonymous but linked to a user account. Sees past requests. |
| Provider (independent rider) | Solo motorcycle or bicycle courier. Completes identity verification (National ID front + back + photo). |
| Provider (courier company) | Business with registered address. Posts bids and assigns riders to jobs. |
| Provider (logistics company) | Larger fleet operator. Similar to courier company. |
| Admin | Platform administrator. Reviews verification requests, manages providers, monitors all activity. |

### Core Value Proposition
- No login needed to post a delivery — reducing friction for first-time users
- Multiple fulfillment modes adapt to how users actually behave (some want to pick a specific rider, others want the cheapest price)
- Public tracking page updates in real time via Server-Sent Events — no need to refresh
- All provider documents (National ID, business registration) are encrypted at rest using AES-256-GCM before being stored in Supabase
- Reviews submitted after delivery appear on provider listings, influencing future customer choices

---

## 3. Technology Stack

### Backend
| Component | Technology | Version / Notes |
|---|---|---|
| Runtime | Node.js | v20+ |
| Framework | NestJS | v10 |
| Language | TypeScript | v5 |
| ORM | Prisma | v6 |
| Database | PostgreSQL | v15+ |
| Authentication | JWT (access + refresh tokens) | RS256-compatible, HS256 in dev |
| Password hashing | argon2 | Industry standard, not bcrypt |
| File encryption | AES-256-GCM | Per-file 12-byte random IV, 16-byte auth tag |
| File storage | Supabase Storage | Service-role key, bypasses RLS |
| API docs | Swagger / OpenAPI | Auto-generated via `@nestjs/swagger` |
| Real-time | Server-Sent Events (SSE) | RxJS Observable + Node EventEmitter |
| Validation | class-validator + class-transformer | Applied globally |

### Frontend
| Component | Technology | Notes |
|---|---|---|
| Framework | Next.js | v15 (App Router) |
| Language | TypeScript | v5 |
| UI Components | Custom component library | Tailwind CSS-based |
| State management | Zustand | Persisted to localStorage |
| Forms | react-hook-form + Zod | Type-safe validation |
| HTTP client | Custom `apiClient` wrapper | Handles auth headers, error extraction, 401 redirect |
| Icons | lucide-react | |
| Phone input | libphonenumber-js (custom PhoneInput) | Cameroon-aware normalization |

### Infrastructure (planned / active)
| Service | Purpose |
|---|---|
| Supabase | PostgreSQL host + Storage (file uploads) |
| Supabase Storage bucket `deligo-documents` | Encrypted provider verification documents |
| Vercel (planned) | Frontend hosting |
| Railway / Render (planned) | Backend hosting |

---

## 4. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   Browser (Next.js 15 App Router — Vercel)                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │  Public pages│  │ Provider     │  │ Admin portal         │  │
│   │  /           │  │ portal       │  │ /admin/*             │  │
│   │  /providers  │  │ /provider/*  │  │                      │  │
│   │  /track/:code│  │              │  │                      │  │
│   │  /request/*  │  │              │  │                      │  │
│   └──────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + SSE
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│                                                                 │
│   NestJS REST API  (Railway / Render)                           │
│   Base URL: /api/v1                                             │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │  Auth    │ │ Provider │ │ Delivery │ │  Intelligence    │  │
│   │  Module  │ │ Profile  │ │ Request  │  │  Module          │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │ Customer │ │ Location │ │  Upload  │ │  Admin           │  │
│   │ Contact  │ │  Module  │ │  Module  │ │  Module          │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                                                                 │
│   Global Guards: JwtAuthGuard → RolesGuard (APP_GUARD chain)   │
└───────────────┬───────────────────────────┬─────────────────────┘
                │ Prisma                     │ HTTP
                ▼                           ▼
┌────────────────────┐          ┌────────────────────────────────┐
│   PostgreSQL       │          │   Supabase Storage             │
│   (Supabase host)  │          │   bucket: deligo-documents     │
│                    │          │   (AES-256-GCM encrypted files) │
│   28 tables        │          └────────────────────────────────┘
│   17 enumerations  │
└────────────────────┘
```

### Request Flow (typical)
1. Browser sends `fetch()` to `/api/v1/*`
2. `JwtAuthGuard` inspects `Authorization: Bearer <token>` header. If `@Public()` is present, passes through.
3. `RolesGuard` checks the `@Roles()` decorator against the user's roles from the JWT payload.
4. Controller delegates to the service.
5. Service reads/writes via Prisma to PostgreSQL.
6. For file operations, `UploadService` encrypts with AES-256-GCM then calls `SupabaseService`.
7. For real-time tracking updates, the service calls `TrackingEventsService.emit(code)` which triggers all open SSE streams for that tracking code.
8. Response is wrapped in `{ success: true, data: ... }` via the `ok()` helper.

---

## 5. Backend Architecture — NestJS

### Module Dependency Graph

```
AppModule
├── ConfigModule (global, cached, validates env at startup)
├── DatabaseModule (global — exports PrismaService)
├── UsersModule
├── AuthModule (imports UsersModule, JwtModule)
├── CustomerContactModule
├── DeliveryRequestModule (imports NotificationModule)
├── LocationModule
├── ProviderProfileModule (imports NotificationModule)
├── IntelligenceModule
├── UploadModule (imports CryptoService, SupabaseService)
├── AdminModule
└── [Global providers]: JwtAuthGuard, RolesGuard (via APP_GUARD)
```

> Phase 3 additions: `ProviderProfileModule` now also exports branch and rider-route sub-resources. `DeliveryRequestModule` now handles provider abandonment and customer cancellation flows.

### Global Guards

Two guards are registered as `APP_GUARD` providers in `AppModule`, meaning they run on every request in this order:

**1. JwtAuthGuard**
- Inherits from Passport's `AuthGuard('jwt')`.
- Skips JWT verification entirely when the route has the `@Public()` decorator.
- On protected routes, validates the Bearer token and attaches the decoded `JwtPayload` to `request.user`.
- Returns `401 Unauthorized` if token is missing or expired.

**2. RolesGuard**
- Reads the `@Roles(...roleCodes)` decorator from the route handler.
- If no `@Roles()` is set, passes through (any authenticated user can access).
- Checks that `request.user.roles` includes at least one of the required role codes.
- Returns `403 Forbidden` if the user lacks the required role.

**OptionalJwtAuthGuard** — a separate guard used only on `POST /delivery-requests`. It attempts JWT validation but does not fail if no token is present. This allows both anonymous and authenticated customers to create requests.

---

### 5.1 Auth Module

**File:** `src/modules/auth/`

**Responsibilities:**
- User registration (provider-only via public form)
- User login (email or phone + password)
- JWT access token + refresh token generation
- Token refresh

**Key behaviours:**
- Phone numbers are normalized to `+237XXXXXXXXX` format before storage and lookup using `normalizeCameroonPhone()`.
- Passwords are hashed using **argon2** (not bcrypt). The argon2 hash is stored in `User.passwordHash`.
- `AccountStatus` is checked on login — `suspended`, `deactivated`, and `rejected` accounts cannot log in.
- The JWT payload contains: `sub` (userId), `roles` (array of role codes), `iat`, `exp`.
- Access tokens expire in a configurable duration (set by `JWT_EXPIRY` env var).
- Refresh tokens are longer-lived (set by `JWT_REFRESH_EXPIRY`).

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Create a new provider account |
| POST | `/api/v1/auth/login` | Public | Login with email or phone + password |
| POST | `/api/v1/auth/refresh` | Public | Exchange refresh token for new access token |

**Registration flow:**
1. Receive `fullName`, `phone`, `email` (optional), `password`, `role`.
2. Normalize phone number.
3. Hash password with argon2.
4. Call `UsersService.createUserWithRole()` which creates a `User` record and a `UserRole` record linking the user to the specified role.
5. Return `{ user, tokens: { accessToken, refreshToken } }`.

**Login flow:**
1. Receive `email` or `phone` + `password`.
2. Find user by email or normalized phone.
3. Verify password with `argon2.verify()`.
4. Check account status.
5. Update `lastLoginAt`.
6. Return `AuthResult` with tokens.

---

### 5.2 Users Module

**File:** `src/modules/users/`

**Responsibilities:**
- Internal service used by AuthModule and AdminModule.
- Creates users with their initial role.
- Finds users by email or phone for login.

**Key method — `createUserWithRole`:**
- Creates `User` + finds/creates the `Role` row + creates `UserRole` linking them, all in one Prisma transaction.

---

### 5.3 Customer Contact Module

**File:** `src/modules/customer-contact/`

**Responsibilities:**
- Manages `CustomerContact` records — the anonymous identity used when a customer posts a delivery request without an account.
- Supports linking a contact to an authenticated user's account after the fact.
- Allows customers to save and reuse their contact details.

**Key design decision:** A customer contact is separate from a user account. This allows completely unauthenticated delivery request creation. When a user later creates an account, their past contacts (and therefore their past requests) can be linked to their user ID.

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/customer-contacts` | Public | Create a new customer contact |
| GET | `/api/v1/customer-contacts/me` | JWT | Get the authenticated user's linked contact |
| PATCH | `/api/v1/customer-contacts/:id` | JWT | Update contact details |

**Fields on CustomerContact:**
- `fullName` — Display name of the customer
- `phone` — Optional direct phone
- `whatsappNumber` — Required — used for delivery notifications
- `paymentNumber` — Mobile money number for payment
- `email` — Optional
- `preferredLanguage` — `en` or `fr`
- `userId` — Nullable — set when linked to a user account

---

### 5.4 Location Module

**File:** `src/modules/location/`

**Responsibilities:**
- Manages the three-level geographic hierarchy used for delivery routes: **Region → Town → Quarter**.
- Seeded from `prisma/seeds/locations.seed.ts` with real Cameroonian regions, towns, and quarters.
- Provides lookup endpoints for the request wizard's location pickers.

**Hierarchy:**
```
Region (e.g., Littoral)
  └── Town (e.g., Douala)
        └── Quarter (e.g., Bonanjo, Akwa, Bonapriso, ...)
```

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/locations/regions` | Public | List all regions |
| GET | `/api/v1/locations/towns?regionId=` | Public | List towns in a region |
| GET | `/api/v1/locations/quarters?townId=` | Public | List quarters in a town |
| GET | `/api/v1/locations/quarters/by-region?regionId=` | Public | List all quarters in a region (used by same-region picker) |

**Same-region delivery enforcement:** DeliGo restricts each delivery to a single region. The `LocationPickerModal` component accepts a `lockedRegion` prop. When set, the region-selection step is skipped and quarters are pre-loaded for that region only. The route wizard (`/request/[draftId]/route`) passes the locked region once either side is set — locking both pickers to the same region. A "Change region" link clears both sides, allowing the customer to start fresh. This is enforced client-side; no server-side cross-region validation is currently applied.

---

### 5.5 Provider Profile Module

**File:** `src/modules/provider-profile/`

**Responsibilities:**
- CRUD for `ProviderProfile` records (one per provider user).
- Provider availability management.
- Identity verification record creation and admin review.
- Public listing with recent reviews.
- Admin-level provider management.

**Provider types:**
- `independent_rider` — Shows `baseCity` and `serviceCoverage`
- `courier_company` — Shows `businessAddress`, `businessLat`, `businessLng`
- `logistics_company` — Same as courier company

**Verification statuses:** `unverified` → `pending` → `verified` (or `rejected` / `suspended`)

**Phone number visibility rule:** A provider's phone number is only included in public API responses when their `verificationStatus === 'verified'`. Unverified providers' phone numbers are hidden from the public.

**Listing with reviews:** The `findAll` endpoint runs a single batch query after fetching the page of providers. It fetches all `ReviewRating` records where `providerProfileId IN [ids from current page]`, groups them by provider, keeps the two most recent reviews per provider, and attaches them as `recentReviews` in the response. This is a single additional database query — not N+1.

**Provider pricing tiers:** A provider can optionally advertise two price tiers set via their profile edit page and stored on `ProviderProfile`:
- `priceInTown` — approximate starting price in XAF for deliveries entirely within the provider's town
- `priceInRegion` — approximate starting price in XAF for same-region deliveries to a different town (e.g., Yaoundé → Obala within Centre region)

Both are `DECIMAL(12,2) nullable`. When set, they are shown on the public provider listing card as labelled FCFA badges. These are indicative, not binding — final price is always negotiated.

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/provider-profiles` | Provider | Create profile (one per user) |
| GET | `/api/v1/provider-profiles` | Public | List all providers (paginated, filterable, includes recentReviews) |
| GET | `/api/v1/provider-profiles/me/stats` | Provider | Dashboard stats (completed deliveries, rating, earnings) |
| GET | `/api/v1/provider-profiles/me/agents` | Provider | List sub-agents (for company providers) |
| GET | `/api/v1/provider-profiles/:id` | Public | Get one provider profile by ID |
| PATCH | `/api/v1/provider-profiles/me` | Provider | Update own profile |
| PATCH | `/api/v1/provider-profiles/me/availability` | Provider | Toggle availability status |
| POST | `/api/v1/provider-profiles/me/verification-records` | Provider | Upload a verification document |
| GET | `/api/v1/provider-profiles/admin/verification-records` | Admin | List pending verification records |
| PATCH | `/api/v1/provider-profiles/admin/verification-records/:id` | Admin | Approve or reject a verification record |
| PATCH | `/api/v1/provider-profiles/admin/:id/verification` | Admin | Set provider's overall verification status |
| POST | `/api/v1/provider-profiles/me/branches` | Provider (company) | Add a branch location |
| GET | `/api/v1/provider-profiles/me/branches` | Provider (company) | List own branch locations |
| GET | `/api/v1/provider-profiles/me/branches/:id/stats` | Provider (company) | Active + completed request counts for one branch |
| DELETE | `/api/v1/provider-profiles/me/branches/:id` | Provider (company) | Soft-delete a branch |
| POST | `/api/v1/provider-profiles/me/routes` | Provider (rider) | Create a planned route |
| GET | `/api/v1/provider-profiles/me/routes` | Provider (rider) | List own planned routes |
| GET | `/api/v1/provider-profiles/me/routes/:id/matching-jobs` | Provider (rider) | Open requests whose towns match this route |
| DELETE | `/api/v1/provider-profiles/me/routes/:id` | Provider (rider) | Soft-delete a planned route |

#### Branch Locations (Company Providers)

Courier and logistics companies can register multiple physical branch offices. Each branch is linked to a `Quarter`, which places it within a `Town`.

**Business logic — proximity matching:**
When a customer creates a request, the provider recommendation engine resolves the `Town` for both the pickup quarter and the destination quarter. It then queries `ProviderBranch` records where `quarter.townId IN [pickupTownId, destinationTownId]`. Any provider whose branch is found in that set receives a **+12 point score boost** in the recommendation ranking and the matching branch name is included as `nearbyBranchName` in the response.

This enables the system to surface agencies whose local offices are geographically close to the customer's pickup or drop-off point, even without GPS coordinates. Proximity is defined at the **town level** — a branch in Bonanjo (a quarter of Douala) is considered "near" any pickup or destination in any quarter of Douala.

**Branch stats:** The `GET /me/branches/:id/stats` endpoint returns `activeCount` (requests in progress) and `completedCount` for requests whose pickup or destination town matches the branch's town. This feeds the dashboard's branch overview grid on the company provider's portal.

**CreateBranchDto:**
```typescript
{
  name: string;             // Branch display name (max 180 chars)
  quarterId: string;        // UUID of the quarter this branch is in
  phoneNumber?: string;     // Optional branch phone number
  isHeadquarters?: boolean; // If true, all other branches are un-flagged as HQ
}
```

#### Rider Planned Routes

Independent riders can declare routes they plan to travel at specific times. This allows the system to show them open delivery requests that are compatible with their planned journey.

**Route:** a rider specifies an `originQuarterId` (where they start) and a `destinationQuarterId` (where they are going). Optionally they set a `departureTime` (`HH:MM`), a `isRecurring` flag, and `recurringDays` (an array of day names like `["mon", "wed", "fri"]`).

**Matching jobs:** `GET /me/routes/:id/matching-jobs` returns open delivery requests (`created`, `marketplace_open`, `offers_received`) where:
- The request's pickup quarter is in the **same town** as the route's origin quarter (`pickupQuarter.townId === originQuarter.townId`)
- The request's destination quarter is in the **same town** as the route's destination quarter (`destinationQuarter.townId === destinationQuarter.townId`)

This surfaces jobs that naturally align with the rider's announced trajectory. The rider sees them in the **My Routes** page under the provider portal, grouped by route, with each matching job showing tracking code, delivery type, route summary, item names, fragile flag, and desired reward amount.

**CreateRiderRouteDto:**
```typescript
{
  originQuarterId: string;        // UUID — where the rider starts
  destinationQuarterId: string;   // UUID — where the rider is going
  departureTime?: string;         // "HH:MM" format (e.g., "10:00")
  isRecurring?: boolean;          // Default false
  recurringDays?: string[];       // e.g., ["mon", "tue", "wed"]
}
```

**Verification document types (`IdentityVerificationType`):**
- `phone` — Phone number verification
- `national_id` — National ID card (two records: front image + back image, with ID number embedded in `submittedValue` as `"<number> (front)"` and `"<number> (back)"`)
- `profile` — Profile photo
- `business_registration` — Business registration certificate
- `agency_document` — Agency-specific documents
- `rider_identity` — Rider-specific identity documents

---

### 5.6 Delivery Request Module

**File:** `src/modules/delivery-request/`

This is the core business module. It handles the entire lifecycle of a delivery request from creation through completion.

**Sub-services:**
- `DeliveryRequestService` — Core logic
- `TrackingEventsService` — SSE pub/sub singleton

#### Tracking Code Generation

Format: `DLG-XXXXXX` where X is drawn from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (unambiguous characters — no O/0, I/1 confusion). Length is 10 characters total. Collision is handled by retry.

#### Pricing Estimation

A simple region-based pricing estimate is computed at request creation time:

```
REGION_BASE_PRICE:
  West: 1,000 XAF
  Centre: 1,500 XAF
  Littoral: 1,500 XAF
  South West: 1,500 XAF
  (default): 1,500 XAF

estimatedCost = baseline + (500 if cross-town, 0 if same town)
```

This is stored as `DeliveryRequest.deliveryCost` and shown to the customer on the tracking page. It is distinct from the final negotiated price.

#### Supported Delivery Types

| `deliveryType` value | Display name | Notes |
|---|---|---|
| `agency_pickup` | Agency Pickup | Collecting a package from an agency or transit station |
| `document_delivery` | Document Delivery | Letters, files, contracts, official papers |
| `product_delivery` | Product Delivery | Parcels and small goods |
| `purchase_delivery` | Purchase & Delivery | Provider buys the item and delivers it |
| `business_delivery` | Business Delivery | Recurring support for shops and teams |
| `intercity_delivery` | Intercity Delivery | Between cities with trusted carriers |
| `medication_delivery` | Medication Delivery | Provider sources medication from any pharmacy in the region. Pickup location is optional; destination required. Item name/category/weight/size/fragile fields are hidden; a "Medication / Prescription Description" textarea is shown instead. |
| `other` | Other | Does not fit the above list |

#### Fulfillment Modes

There are four ways a delivery request can be matched to a provider:

| Mode | `fulfillmentMode` value | Description |
|---|---|---|
| Open Marketplace | `open_marketplace` | Request is posted publicly to all providers. Any provider can bid or take it. Customer accepts a bid. |
| Recommended Provider | `recommended_provider` | Customer selects a provider from a ranked recommendation list. Request is sent directly to that provider. |
| Search Provider | `search_provider` | Customer searches for and directly selects a provider. Similar to recommended but without ranking. |
| Agency Dispatch | `agency_dispatch` | A courier/logistics company receives the request and internally assigns it to one of their riders. |

#### Delivery Request Status Machine

```
draft
  └──► payment_initiated
         └──► payment_confirmed
                └──► created / marketplace_open
                       ├── open_marketplace path:
                       │     ├── offers_received (when first bid arrives)
                       │     └── provider_assigned (customer accepts a bid)
                       │
                       └── direct assignment path:
                             └── provider_assigned (provider accepts direct request)

provider_assigned ──► pickup_verified ──► in_transit
  │                        │                   │
  │              (provider records             │
  │               COLLECT action)              │
  │                                            │
  │               (in any active status)       │
  └──────────────────────────────────────────► marketplace_open
                   Provider abandons:          (request returns to open market)
                   TrackingEvent: PROVIDER_ABANDONED
                   SSE push

provider_assigned
  └──► pickup_verified  (provider records COLLECT action)
         └──► in_transit  (provider records START_TRANSIT action)
                └──► delivered  (provider records DELIVER action)
                       └──► completed
```

Terminal states: `cancelled` (customer-initiated), `disputed`, `expired`

**Provider abandonment** can occur from `provider_assigned`, `pickup_verified`, or `in_transit`. The provider must agree to a liability disclaimer and supply a reason. The request returns to `marketplace_open` (fulfillment mode `open_marketplace`) with all its original data intact so any provider can claim it.

**Customer cancellation** is only allowed while the request is in `draft`, `created`, `marketplace_open`, or `offers_received` — i.e., no provider has yet accepted it. Once a provider has been assigned, the customer cannot unilaterally cancel (they must raise a dispute). All pending offers are expired and the request transitions to `cancelled`.

#### Workflow Actions (Provider Records)

| Action string | Status transition | Event type recorded |
|---|---|---|
| `collect` | → `pickup_verified` | `PARCEL_COLLECTED` |
| `start_transit` | → `in_transit` | `IN_TRANSIT` |
| `arrive` | (no status change) | `ARRIVED_DESTINATION` |
| `deliver` | → `delivered` | `DELIVERED` |

After each workflow action, `TrackingEventsService.emit(trackingCode)` is called to push an SSE update to any connected tracking page.

#### Review System

- Only available when `requestStatus` is `delivered` or `completed`.
- One review per `(deliveryRequestId, customerContactId)` pair — enforced by the service.
- **Create:** `POST /delivery-requests/track/:code/review` — creates review, recalculates provider's `ratingAverage` and `ratingCount`.
- **Update:** `PATCH /delivery-requests/track/:code/review` — finds existing review, updates it, recalculates provider rating.
- Rating recalculation uses a Prisma `aggregate` query on all non-deleted reviews for that provider: `_avg.rating` and `_count.rating`.
- The `findByTrackingCode` method includes a `reviewRating.findFirst()` in its `Promise.all` batch, so `data.review` always reflects the current state.

**Endpoints (full list):**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/delivery-requests` | Public (OptionalJWT) | Create a new delivery request |
| GET | `/delivery-requests/track/:code/events` | Public | SSE stream for real-time tracking updates |
| GET | `/delivery-requests/track/:code` | Public | Get public tracking data (status, route, events, offers, review) |
| GET | `/delivery-requests/track/:code/review` | Public | Check if review is eligible and if one exists |
| POST | `/delivery-requests/track/:code/review` | Public | Submit a review (1–5 stars + comment) |
| PATCH | `/delivery-requests/track/:code/review` | Public | Update an existing review |
| POST | `/delivery-requests/track/:code/offers/:offerId/accept` | Public | Customer accepts a provider's bid |
| POST | `/delivery-requests/track/:code/offers/:offerId/reject` | Public | Customer rejects a provider's bid |
| GET | `/delivery-requests/recommended-providers` | Public | List available providers ranked by rating. Accepts `?city=`, `?pickupQuarterId=`, `?destinationQuarterId=`. Providers with a branch in the pickup or destination town receive a +12 score boost and return a `nearbyBranchName` field. |
| GET | `/delivery-requests/me` | JWT | List all requests linked to the authenticated user |
| GET | `/delivery-requests/me/:id` | JWT | Get one owned request with full detail |
| GET | `/delivery-requests/marketplace` | Provider | Open marketplace requests in the provider's area |
| GET | `/delivery-requests/provider/direct-requests` | Provider | Direct requests awaiting provider's accept/reject |
| GET | `/delivery-requests/provider/my-requests` | Provider | Requests currently assigned to this provider |
| GET | `/delivery-requests/provider/my-offers` | Provider | Bids submitted by this provider |
| POST | `/delivery-requests/:id/take` | Provider | Provider directly claims an open marketplace request |
| POST | `/delivery-requests/:id/bid` | Provider | Provider submits a price bid |
| POST | `/delivery-requests/:id/accept` | Provider | Provider accepts a direct request |
| POST | `/delivery-requests/:id/reject` | Provider | Provider rejects a direct request (moves to open marketplace) |
| POST | `/delivery-requests/:id/workflow/:action` | Provider | Record a delivery workflow step (collect/start_transit/arrive/deliver) |
| POST | `/delivery-requests/:id/assign-rider` | Provider | Company provider assigns an internal rider to a request |
| POST | `/delivery-requests/:id/abandon` | Provider | Provider abandons an accepted delivery (liability agreement + reason required). Request returns to open marketplace. |
| POST | `/delivery-requests/track/:code/cancel` | Public | Customer cancels a request that has no accepted provider yet. All pending offers are expired. |

#### Provider Abandonment — `POST /delivery-requests/:id/abandon`

**Required body (`AbandonDeliveryDto`):**
```typescript
{
  agreedToTerms: true;   // Must be exactly `true` — validated with @Equals(true)
  reason: string;        // 10–500 characters — why the provider is abandoning
}
```

**Validated preconditions:**
- Provider must own (be assigned to) the specified request.
- Request `requestStatus` must be one of: `provider_assigned`, `pickup_verified`, `in_transit`.
- If status is already `delivered`, `completed`, or `cancelled` → 400 Bad Request.

**Transaction (atomic):**
1. Mark the `acceptedOffer` as `withdrawn`.
2. Clear `selectedProviderProfileId`, `selectedAgencyId`, `acceptedOfferId`, `providerAssignedAt` on the request.
3. Set `requestStatus = 'marketplace_open'` and `fulfillmentMode = 'open_marketplace'`.
4. Append a `TrackingEvent` of type `PROVIDER_ABANDONED` with `notes` = provider's reason.
5. Emit SSE to update any open tracking pages in real time.

**Frontend (provider portal):**
On the **Active** tab of `/provider/requests`, each active request card has a discrete "Cancel delivery" text link. Clicking it expands an inline panel with:
- Liability warning listing three terms the provider must acknowledge
- Checkbox: "I have read and agree to the above terms, and I confirm I do not hold the parcel"
- Reason textarea (min 10 characters)
- "Confirm cancellation" button (disabled until checkbox is checked AND reason is at least 10 chars)
- "Keep delivery" button to collapse the panel without action

#### Customer Cancellation — `POST /delivery-requests/track/:code/cancel`

**Optional body (`CancelDeliveryDto`):**
```typescript
{
  reason?: string;   // Optional, max 500 characters
}
```

**Validated preconditions:**
- Request `requestStatus` must be one of: `draft`, `created`, `marketplace_open`, `offers_received`.
- If a provider has already been assigned (`provider_assigned` or beyond) → 400 Bad Request.

**Transaction (atomic):**
1. Expire all `submitted` offers for this request.
2. Set `requestStatus = 'cancelled'`, record `cancelledAt`.
3. Append a `TrackingEvent` of type `REQUEST_CANCELLED`.
4. Emit SSE.

**Frontend (tracking page):**
When `requestStatus` is in the cancellable range, the bottom of the tracking page shows a "Cancel request" card. The card starts collapsed (showing only a single-line prompt). Clicking "Cancel request" expands an inline confirmation section with:
- A warning that the action is permanent and cannot be undone
- Optional reason textarea
- "Yes, cancel request" button (danger styling)
- "Keep request" button to close without action
After cancellation, SSE fires `loadData()` which shows the `cancelled` status in the progress stepper.

---

### 5.7 Intelligence Module

**File:** `src/modules/intelligence/`

A pure computation module — no database access, all services are stateless. Contains four services that provide AI-adjacent scoring and ranking.

All four endpoints are public (`@Public()`).

#### CostPredictionService

Predicts a fair delivery cost range given:
- Item type (`document`, `parcel`, `food`, `electronics`, `business`, `intercity`, `other`)
- Distance in km
- Weight in kg
- Whether items are fragile
- Optional provider-specific rate override
- Optional historical delivery data for Bayesian-style adjustment

**Algorithm:**
```
ruleBasedCost = baseFee + (distanceKm × pricePerKm) + (weightKg × pricePerKg) + fragileFee
boundedCost = clamp(ruleBasedCost, minPrice, maxPrice)

if historicalDeliveries provided:
  historyWeight = clamp(count / 20, 0.15, 0.45)
  recommendedCost = boundedCost × (1 - historyWeight) + historicalAvg × historyWeight
else:
  recommendedCost = boundedCost

spread = max(250, recommendedCost × (0.18 if historical else 0.25))
return { minimumCost, maximumCost, recommendedCost, confidence, currency }
```

**Default rates by item type (XAF):**

| Item Type | Base Fee | Per Km | Per Kg | Fragile Fee | Min Price |
|---|---|---|---|---|---|
| Document | 700 | 120 | 0 | — | 1,000 |
| Parcel | 900 | 150 | 80 | — | 1,300 |
| Food | 800 | 140 | 50 | — | 1,200 |
| Electronics | 1,200 | 170 | 100 | 500 | 1,800 |
| Business | 1,000 | 150 | 70 | — | 1,500 |
| Intercity | 2,500 | 90 | 120 | — | 3,500 |
| Other | 900 | 150 | 70 | — | 1,300 |

#### ProviderRecommendationService

Ranks a list of provider candidates using a weighted multi-factor score:

| Factor | Weight | Scoring Logic |
|---|---|---|
| Distance | 20% | Inverse distance — closer is better |
| Price | 22% | Ratio to cheapest available price |
| Availability | 16% | Binary: 1 if available, 0 if not |
| Rating | 16% | `rating / 5` |
| Verification level | 16% | Numeric 0–1 passed by caller |
| Reliability | 10% | Completion rate (default 0.65 if unknown) |

Output: ranked list with scores, labels (`Cheapest`, `Fastest`, `Highly Verified`, `Top Rated`), and the single `bestMatch` provider ID.

#### RouteMatchingService

Matches a customer's pickup → destination route against a list of providers who have registered route-based coverage. Used primarily for intercity delivery matching.

#### SmartDispatchService

Suggests which internal rider an agency should assign to a delivery request. Takes rider workload, distance from pickup, and availability into account.

---

### 5.8 Upload Module

**File:** `src/modules/upload/`

**Responsibilities:**
- Accepts file uploads from provider verification forms.
- Enforces allowed MIME types: JPEG, PNG, WebP, PDF.
- Enforces 10 MB file size limit.
- Encrypts files with AES-256-GCM before uploading to Supabase Storage.
- Stores file metadata (including the encryption IV) in the `uploaded_files` table.
- Provides a download endpoint that decrypts on the fly.

**Encryption details:**
- Algorithm: AES-256-GCM
- Key: 32-byte hex string from `APP_ENCRYPTION_KEY` environment variable.
- IV: 12-byte cryptographically random value, generated per file, stored in `UploadedFile.encryptionIv`.
- Auth tag: 16 bytes, appended to the ciphertext before upload.
- Object key pattern: `uploads/<providerProfileId or userId or 'anonymous'>/<fileId>.<ext>.enc`

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/upload` | Provider | Upload a verification document (multipart/form-data) |
| GET | `/api/v1/upload/:fileId` | JWT | Download and decrypt a file |

---

### 5.9 Admin Module

**File:** `src/modules/admin/`

Contains two controllers:

**AdminController** — Protected by `@Roles(RoleCode.Admin)` at the class level:

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | Dashboard KPIs |
| GET | `/api/v1/admin/providers` | Paginated provider list with filters |
| GET | `/api/v1/admin/requests` | Paginated delivery request list |
| GET | `/api/v1/admin/users` | Paginated user list |
| GET | `/api/v1/admin/verifications` | Pending verification records |

**BootstrapController** — Separate controller, no class-level `@Roles()`:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/bootstrap` | `X-Bootstrap-Secret` header | One-time admin account creation |

**Bootstrap security model:**
- Requires `X-Bootstrap-Secret` header to match `ADMIN_BOOTSTRAP_SECRET` environment variable.
- Permanently self-disables: if any admin user already exists in the database, the endpoint throws `403 Forbidden` regardless of the secret. This means even if the secret is re-added to the environment, the endpoint cannot create a second admin once the first has been created.
- `ADMIN_BOOTSTRAP_SECRET` should be deleted from the environment after first use.

**Admin dashboard stats (9 metrics):**
- `totalProviders` — All non-deleted provider profiles
- `pendingVerifications` — Providers with `verificationStatus = 'pending'`
- `verifiedProviders` — Providers with `verificationStatus = 'verified'`
- `activeRequests` — Requests in `provider_assigned`, `pickup_verified`, or `in_transit` status
- `openMarketplaceRequests` — Marketplace requests in `created` or `offers_received` status
- `completedDeliveries` — Requests in `delivered` or `completed` status
- `totalRatings` — Count of all non-deleted reviews
- `totalNotifications` — Count of all notification records
- `totalUsers` — Count of all non-deleted users

---

### 5.10 Notification Module

**File:** `src/modules/notification/`

Currently a stub service used as a dependency injection target. The `NotificationService` is imported by `ProviderProfileModule` and `DeliveryRequestModule`. The service stores `Notification` records in the database. Actual delivery via WhatsApp, SMS, and email is planned for a future phase.

**Notification channels:** `dashboard`, `whatsapp`, `email`, `sms`

---

## 6. Database Design

### Overview

The database has **30 tables** and **17 enumerations**. All primary keys are UUIDs. All timestamps use `TIMESTAMPTZ` for timezone-awareness. Soft deletes are implemented via `deletedAt` nullable timestamps on all major entities.

> Phase 3 additions: `provider_branches` (table 29) and `rider_routes` (table 30).

### Enumerations (17 total)

| Enum | Values |
|---|---|
| `AccountStatus` | `pending`, `active`, `suspended`, `rejected`, `deactivated` |
| `VerificationStatus` | `unverified`, `pending`, `verified`, `rejected`, `suspended` |
| `DeliveryRequestStatus` | `draft`, `payment_initiated`, `payment_confirmed`, `created`, `marketplace_open`, `offers_received`, `provider_assigned`, `pickup_verified`, `in_transit`, `delivered`, `completed`, `cancelled`, `disputed`, `expired` |
| `PaymentStatus` | `unpaid`, `initiated`, `pending`, `confirmed`, `failed`, `cancelled`, `refunded` |
| `FulfillmentMode` | `open_marketplace`, `recommended_provider`, `search_provider`, `agency_dispatch` |
| `OfferStatus` | `submitted`, `accepted`, `rejected`, `expired`, `withdrawn` |
| `AvailabilityStatus` | `available`, `unavailable`, `busy`, `offline` |
| `ProviderType` | `independent_rider`, `courier_company`, `logistics_company` |
| `VerificationCodeType` | `pickup`, `delivery`, `phone_verification`, `payment_confirmation` |
| `PaymentProviderStatus` | `initiated`, `pending`, `confirmed`, `failed`, `cancelled`, `refunded` |
| `EscrowStatus` | `held`, `released`, `refunded`, `disputed`, `partially_released` |
| `WalletStatus` | `active`, `frozen`, `closed` |
| `WalletTransactionType` | `credit`, `debit`, `payout`, `refund`, `commission`, `adjustment` |
| `DispatchAssignmentStatus` | `suggested`, `assigned`, `accepted`, `rejected`, `in_progress`, `completed`, `cancelled` |
| `IdentityVerificationType` | `phone`, `national_id`, `profile`, `business_registration`, `agency_document`, `rider_identity` |
| `ReviewStatus` | `pending`, `approved`, `rejected`, `expired` |
| `NotificationChannel` | `dashboard`, `whatsapp`, `email`, `sms` |
| `NotificationStatus` | `pending`, `sent`, `delivered`, `failed`, `cancelled` |
| `ProofType` | `pickup_photo`, `package_photo`, `delivery_photo`, `delivery_confirmation`, `signature`, `other` |
| `CommissionType` | `percentage`, `fixed` |

### Entity Models (28 tables)

#### User (`users`)
The authentication entity. Every person who registers gets a `User` row.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `fullName` | VARCHAR(160) | |
| `phone` | VARCHAR(32) UNIQUE | Normalized to +237XXXXXXXXX |
| `email` | VARCHAR(255) UNIQUE nullable | |
| `passwordHash` | TEXT nullable | argon2 hash |
| `avatarFileId` | UUID nullable | References `uploaded_files.id` (not FK in schema) |
| `accountStatus` | `AccountStatus` | Default: `pending` |
| `phoneVerifiedAt` | TIMESTAMPTZ nullable | |
| `emailVerifiedAt` | TIMESTAMPTZ nullable | |
| `lastLoginAt` | TIMESTAMPTZ nullable | Updated on each successful login |
| `createdAt` | TIMESTAMPTZ | |
| `updatedAt` | TIMESTAMPTZ | |
| `deletedAt` | TIMESTAMPTZ nullable | Soft delete |
| `createdBy` / `updatedBy` | UUID nullable | Audit trail |

Relations: `roles[]` (UserRole), `providerProfile` (one), `customerContacts[]`, `agencyMembers[]`

#### Role (`roles`)
Lookup table for system roles. Seeded with: `customer`, `provider`, `admin`.

| Column | Type |
|---|---|
| `id` | UUID PK |
| `code` | VARCHAR(64) UNIQUE |
| `name` | VARCHAR(120) |
| `description` | TEXT nullable |

#### UserRole (`user_roles`)
Junction table. One user can have multiple roles (e.g., admin AND provider).

| Column | Type |
|---|---|
| `id` | UUID PK |
| `userId` | UUID FK → users |
| `roleId` | UUID FK → roles |
| `agencyId` | UUID FK → agencies nullable |
| `deletedAt` | TIMESTAMPTZ nullable |

Unique constraint: `(userId, roleId, agencyId)`.

#### CustomerContact (`customer_contacts`)
Anonymous customer identity. Decoupled from `User` to enable no-login delivery requests.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `userId` | UUID FK nullable | Links to user account if authenticated |
| `fullName` | VARCHAR(160) | |
| `phone` | VARCHAR(32) nullable | |
| `whatsappNumber` | VARCHAR(32) REQUIRED | Primary contact for delivery notifications |
| `paymentNumber` | VARCHAR(32) nullable | Mobile money (MTN/Orange) |
| `email` | VARCHAR(255) nullable | |
| `preferredLanguage` | VARCHAR(16) | Default: `en` |

#### Agency (`agencies`)
Represents a delivery company or agency entity. Can own multiple `ProviderProfile` records and have `AgencyMember` staff users.

| Key columns | Type |
|---|---|
| `name`, `legalName`, `slug` | Names and URL slug |
| `verificationStatus` | VerificationStatus enum |
| `subscriptionStatus` | VARCHAR — `inactive`, `active`, `trial` |
| `isFeatured` | Boolean |
| `city`, `country` | Location |

#### AgencyMember (`agency_members`)
Links a `User` to an `Agency` with a role (e.g., `dispatcher`, `manager`).

#### ProviderProfile (`provider_profiles`)
The public-facing delivery provider entity. One per provider user (unique constraint on `userId`).

| Key columns | Notes |
|---|---|
| `providerType` | `independent_rider`, `courier_company`, `logistics_company` |
| `displayName` | Shown on listings and provider cards |
| `description` | Free-text about the provider |
| `baseCity` | Riders only — their operating city |
| `serviceCoverage` | Riders only — text description of coverage area |
| `businessAddress` | Companies only |
| `businessLat` / `businessLng` | Companies only — DECIMAL(10,7) |
| `ratingAverage` | DECIMAL(3,2) — auto-recalculated after each review |
| `ratingCount` | INT — auto-recalculated after each review |
| `priceInTown` | DECIMAL(12,2) nullable — provider's advertised price for in-town deliveries (XAF) |
| `priceInRegion` | DECIMAL(12,2) nullable — provider's advertised price for same-region cross-town deliveries (XAF) |
| `verificationStatus` | Determines phone number visibility |
| `availabilityStatus` | Shown on listing card |
| `isFeatured` | Boosted in listing sort order |

#### ProviderBranch (`provider_branches`)
A physical branch office registered by a courier or logistics company. Used by the provider recommendation engine for proximity matching.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `providerProfileId` | UUID FK → provider_profiles | Required — the owning company provider |
| `quarterId` | UUID FK → quarters | The quarter this branch is located in |
| `name` | VARCHAR(180) | Branch display name |
| `phoneNumber` | VARCHAR(32) nullable | Branch-specific phone |
| `isHeadquarters` | Boolean | At most one branch per provider should be HQ |
| `deletedAt` | TIMESTAMPTZ nullable | Soft delete |
| `createdAt` | TIMESTAMPTZ | |
| `updatedAt` | TIMESTAMPTZ | |

Back-relations: `providerProfile` → `ProviderProfile`, `quarter` → `Quarter` (which includes `quarter.town.region` for full hierarchy display).

**Branch proximity scoring:** When a customer specifies `pickupQuarterId` or `destinationQuarterId` on the `/recommended-providers` endpoint, the service resolves those quarters to their `townId`. It then batch-queries `ProviderBranch` where `quarter.townId IN [pickupTownId, destinationTownId]`. Any matching provider receives a +12 point boost in the recommendation ranking, and the `nearbyBranchName` field in the response is populated with the branch name.

#### RiderRoute (`rider_routes`)
A planned journey segment declared by an independent rider. Used to surface compatible open delivery requests without GPS or map APIs.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `providerProfileId` | UUID FK → provider_profiles | The rider who owns this route |
| `originQuarterId` | UUID FK → quarters | Named relation: `"RiderRouteOrigin"` |
| `destinationQuarterId` | UUID FK → quarters | Named relation: `"RiderRouteDestination"` |
| `departureTime` | VARCHAR(5) nullable | `"HH:MM"` format (e.g., `"10:00"`) |
| `isRecurring` | Boolean | Whether this route repeats on `recurringDays` |
| `recurringDays` | TEXT[] | PostgreSQL array — day names (`"mon"`, `"tue"`, …) |
| `deletedAt` | TIMESTAMPTZ nullable | Soft delete |
| `createdAt` | TIMESTAMPTZ | |
| `updatedAt` | TIMESTAMPTZ | |

The two quarter FKs use Prisma named relations to disambiguate the two back-relations on `Quarter`: `riderRoutesAsOrigin` and `riderRoutesAsDestination`.

**Route matching:** `GET /provider-profiles/me/routes/:id/matching-jobs` finds `DeliveryRequest` records where `route.pickupQuarter.townId === originQuarter.townId` AND `route.destinationQuarter.townId === destinationQuarter.townId`, in statuses `created`, `marketplace_open`, or `offers_received`. Returns up to 30 results.

#### PricingRule (`pricing_rules`)
Per-provider or per-agency pricing overrides. Used by the Intelligence module's cost prediction.

| Column | Type |
|---|---|
| `providerProfileId` / `agencyId` | FK to owner |
| `deliveryType` | Optional filter by delivery type |
| `baseFee` | DECIMAL(12,2) |
| `pricePerKm` | DECIMAL(12,2) |
| `pricePerKg` | DECIMAL(12,2) |
| `fragileItemFee` | DECIMAL(12,2) |
| `minPrice` / `maxPrice` | DECIMAL(12,2) nullable |
| `currency` | Default: XAF |

#### DeliveryRequest (`delivery_requests`)
The central entity. Everything in the system revolves around this table.

| Key column | Notes |
|---|---|
| `publicTrackingCode` | UNIQUE — `DLG-XXXXXX` — used for all public-facing operations |
| `customerContactId` | FK → customer_contacts |
| `requestStatus` | `DeliveryRequestStatus` enum |
| `paymentStatus` | `PaymentStatus` enum |
| `fulfillmentMode` | `FulfillmentMode` enum |
| `deliveryType` | VARCHAR — `document_delivery`, `product_delivery`, `medication_delivery`, etc. |
| `selectedProviderProfileId` | FK → provider_profiles — set when provider assigned |
| `selectedAgencyId` | FK → agencies — set for agency dispatch |
| `acceptedOfferId` | UNIQUE FK → marketplace_offers — the winning bid |
| `desiredRewardAmount` | DECIMAL — customer's target price for marketplace |
| `deliveryCost` | DECIMAL — estimated cost at creation time |
| `platformFee` | DECIMAL — DeliGo's commission |
| `totalAmount` | DECIMAL — `deliveryCost + platformFee` |
| `currency` | Default: XAF |
| `providerAssignedAt` | TIMESTAMPTZ — when provider accepted |
| `completedAt` / `cancelledAt` | TIMESTAMPTZ — terminal state timestamps |

#### Region / Town / Quarter (`regions`, `towns`, `quarters`)
Three-level geographic hierarchy for Cameroon.

```
Region.id ←→ Town.regionId
Town.id ←→ Quarter.townId
Quarter.id ←→ RequestRoute.pickupQuarterId / .destinationQuarterId
```

#### RequestRoute (`request_routes`)
One-to-one with `DeliveryRequest`. Stores the full route detail.

| Key columns | Notes |
|---|---|
| `pickupQuarterId` | FK → quarters |
| `pickupLandmark` | Free text (e.g., "Near Total petrol station") |
| `destinationQuarterId` | FK → quarters |
| `destinationLandmark` | Free text |
| `estimatedDistanceKm` | DECIMAL — optional, for future map integration |
| `estimatedDurationMinutes` | INT — optional |
| `suggestedRouteSummary` | Text summary from map provider |

The `formatLocation()` function assembles `"Quarter, Town, Region"` from joined records for display.

#### RequestItem (`request_items`)
Each parcel, document, or item in the request. A request can have multiple items.

| Column | Notes |
|---|---|
| `itemName` | Required |
| `category` | Optional category tag |
| `weightKg` | DECIMAL(10,2) nullable |
| `sizeLabel` | `small`, `medium`, `large`, `extra_large` |
| `quantity` | Default: 1 |
| `isFragile` | Boolean — affects pricing |
| `specialInstructions` | Free text |
| `photoFileId` | UUID FK → uploaded_files (optional item photo) |

#### ProviderSelection (`provider_selections`)
Records how and why a specific provider was chosen. One-to-one with `DeliveryRequest`.

| Column | Notes |
|---|---|
| `selectionMode` | `FulfillmentMode` enum |
| `estimatedMinPrice` / `estimatedMaxPrice` | Cost range shown to customer at selection |
| `finalPrice` | Agreed price |
| `recommendationScore` | Score from Intelligence module |
| `selectionMetadata` | JSON blob — raw recommendation context |

#### MarketplaceOffer (`marketplace_offers`)
A bid submitted by a provider on an open marketplace request.

| Column | Notes |
|---|---|
| `providerProfileId` | FK → provider_profiles |
| `offerAmount` | DECIMAL(12,2) — the bid price |
| `estimatedPickupTime` / `estimatedDeliveryTime` | Optional ETA |
| `message` | Optional note to customer |
| `offerStatus` | `submitted`, `accepted`, `rejected`, `expired`, `withdrawn` |
| `acceptedAt` / `rejectedAt` / `expiredAt` | Status timestamps |

When a customer accepts an offer: the offer is marked `accepted`, `DeliveryRequest.acceptedOfferId` is set, `selectedProviderProfileId` is set from the offer's provider, and status transitions to `provider_assigned`.

#### TrackingEvent (`tracking_events`)
Immutable audit log of delivery milestones. Appended-only — never modified.

| Column | Notes |
|---|---|
| `eventType` | `REQUEST_CREATED`, `PROVIDER_ASSIGNED`, `PARCEL_COLLECTED`, `IN_TRANSIT`, `ARRIVED_DESTINATION`, `DELIVERED`, `PROVIDER_ABANDONED`, `REQUEST_CANCELLED` |
| `statusAfterEvent` | Snapshot of the request status |
| `responsibleUserId` / `responsibleProviderProfileId` | Who triggered the event |
| `notes` | Optional free text |
| `locationText` / `latitude` / `longitude` | Optional GPS |
| `eventMetadata` | JSON — additional context |
| `occurredAt` | When the real-world event happened |

#### VerificationCode (`verification_codes`)
OTP-style codes for pickup and delivery confirmation. Not yet fully wired into the UI but the schema and service infrastructure are in place.

| Column | Notes |
|---|---|
| `codeType` | `pickup`, `delivery`, `phone_verification`, `payment_confirmation` |
| `codeHash` | Hashed OTP — never stored in plain text |
| `expiresAt` | TTL |
| `attemptCount` / `maxAttempts` | Brute-force protection |
| `verifiedAt` | Set when code is successfully verified |

#### ProofRecord (`proof_records`)
Photographic or signature proof of pickup/delivery. Each is linked to a `DeliveryRequest` and optionally to an `UploadedFile`.

| Column | Notes |
|---|---|
| `proofType` | `pickup_photo`, `package_photo`, `delivery_photo`, `delivery_confirmation`, `signature`, `other` |
| `fileId` | FK → uploaded_files |
| `signatureText` | Text-based signature fallback |
| `latitude` / `longitude` | GPS coordinates at time of proof |

#### Payment (`payments`)
Records each payment transaction attempt.

| Column | Notes |
|---|---|
| `paymentProvider` | `mtn_momo`, `orange_money`, etc. |
| `paymentMethod` | `mobile_money` |
| `providerReference` | External transaction ID from payment gateway |
| `internalReference` | UNIQUE — DeliGo's internal reference |
| `amount` / `currency` | DECIMAL(12,2) + XAF |
| `payerPhone` | The mobile money number charged |

#### EscrowTransaction (`escrow_transactions`)
Holds payment in escrow between confirmation and provider payout.

| Column | Notes |
|---|---|
| `escrowStatus` | `held`, `released`, `refunded`, `disputed`, `partially_released` |
| `grossAmount` | Total customer payment |
| `platformFee` | DeliGo's cut |
| `providerAmount` | `grossAmount - platformFee` |
| `heldAt` / `releasedAt` / `refundedAt` | State timestamps |
| `recipientUserId` / `recipientAgencyId` | Who receives the payout |

#### Wallet / WalletTransaction
Provider earnings wallet. Tracks `availableBalance` and `pendingBalance`.

| Transaction type | Meaning |
|---|---|
| `credit` | Funds added to wallet |
| `debit` | Funds withdrawn |
| `payout` | Provider payout disbursement |
| `refund` | Customer refund |
| `commission` | Platform fee deduction |
| `adjustment` | Manual admin adjustment |

#### Rider (`riders`)
An individual delivery person employed by an agency. Distinct from a provider user — riders are sub-agents managed by courier/logistics companies.

| Column | Notes |
|---|---|
| `agencyId` | FK → agencies (required — riders belong to an agency) |
| `userId` | FK → users nullable — rider may have a login |
| `vehicleType` | `motorcycle`, `bicycle`, `car`, `truck` |
| `availabilityStatus` | Real-time availability |
| `currentWorkload` | Number of active assignments |
| `lastKnownLat` / `lastKnownLng` | GPS location |
| `verificationStatus` | Whether rider's documents have been checked |

#### DispatchAssignment (`dispatch_assignments`)
Records an agency's internal assignment of a rider to a delivery request.

| Column | Notes |
|---|---|
| `riderId` | FK → riders |
| `assignmentStatus` | `suggested` → `assigned` → `accepted` → `in_progress` → `completed` |
| `assignmentScore` | Score used by SmartDispatchService |
| `assignedByUserId` | Which agency manager made the assignment |

#### VerificationRecord (`verification_records`)
Document submission for identity/business verification. Reviewed by admin.

| Column | Notes |
|---|---|
| `userId` / `providerProfileId` / `agencyId` / `riderId` | Which entity is being verified (only one set per record) |
| `verificationType` | `IdentityVerificationType` enum |
| `status` | `ReviewStatus`: `pending`, `approved`, `rejected`, `expired` |
| `documentFileId` | UUID FK → uploaded_files (the encrypted document) |
| `submittedValue` | Free text — e.g., National ID number, phone number. For National ID: `"<number> (front)"` or `"<number> (back)"` |
| `reviewerUserId` | Admin who reviewed |
| `rejectionReason` / `approvalNotes` | Review notes |

#### ReviewRating (`review_ratings`)
Customer's post-delivery rating of a provider.

| Column | Notes |
|---|---|
| `deliveryRequestId` | FK → delivery_requests |
| `customerContactId` | FK → customer_contacts |
| `providerProfileId` | FK → provider_profiles (nullable) |
| `agencyId` / `riderId` | For future agency/rider-specific ratings |
| `rating` | INT 1–5 |
| `comment` | TEXT nullable |

After every create or update: `ProviderProfile.ratingAverage` and `ratingCount` are recalculated via a Prisma `aggregate` query and immediately written back.

#### Notification (`notifications`)
Outbox table for all notifications. Decoupled from the sending mechanism.

| Column | Notes |
|---|---|
| `channel` | `NotificationChannel` enum |
| `notificationType` | String — e.g., `request_created`, `offer_received` |
| `destination` | Phone number or email address |
| `status` | `NotificationStatus` enum |
| `retryCount` | For failed delivery retry logic |
| `metadata` | JSON — additional context for the notification template |

#### UploadedFile (`uploaded_files`)
Metadata for every uploaded file. The actual content lives in Supabase Storage (encrypted).

| Column | Notes |
|---|---|
| `storageProvider` | `supabase` |
| `bucketName` | `deligo-documents` |
| `objectKey` | Path within the bucket |
| `storageUrl` | Public or signed URL |
| `isEncrypted` | Always `true` for provider documents |
| `encryptionIv` | VARCHAR(64) — hex-encoded 12-byte IV |
| `documentPurpose` | `national_id`, `business_registration`, `profile_photo`, etc. |

#### CommissionRule (`commission_rules`)
Platform commission rules. Effective date ranges allow future rate changes without data migration.

| Column | Notes |
|---|---|
| `commissionType` | `percentage` or `fixed` |
| `commissionValue` | DECIMAL(12,2) |
| `deliveryType` / `providerType` | Filters — null means applies to all |
| `effectiveFrom` / `effectiveTo` | Date range |

#### SubscriptionPlan / AgencySubscription
Agency subscription tiers.

| Column | Notes |
|---|---|
| `monthlyPrice` | DECIMAL(12,2) in XAF |
| `maxRiders` | INT nullable — plan tier cap |
| `features` | JSON blob |

#### AuditLog (`audit_logs`)
Append-only log of all significant data changes. Records `oldValues` and `newValues` as JSON blobs.

#### Dispute (`disputes`)
Raised when a customer disputes a delivery outcome.

| Column | Notes |
|---|---|
| `disputeType` | `not_delivered`, `damaged`, `wrong_item`, etc. |
| `status` | `open`, `under_review`, `resolved`, `closed` |
| `resolutionNotes` | Admin resolution narrative |
| `resolvedByUserId` | Admin who resolved |

#### SystemSetting (`system_settings`)
Key-value store for platform configuration (feature flags, rate limits, maintenance mode, etc.).

| Column | Notes |
|---|---|
| `settingKey` | UNIQUE VARCHAR |
| `settingValue` | JSON — type flexible |
| `isPublic` | Whether the value is exposed via public API |

---

### Entity Relationship Summary

```
User ─────────────────────────────┐
  │ 1:1                            │ N:N via UserRole
  ▼                               ▼
ProviderProfile ◄──── UserRole ────► Role
  │
  │ 1:N (offers, selected requests, reviews, tracking events, uploaded files)
  ▼
DeliveryRequest ◄──── CustomerContact ◄── User (optional)
  │
  ├── 1:1 ──► RequestRoute ──► Quarter × 2 ──► Town ──► Region
  ├── 1:N ──► RequestItem
  ├── 1:N ──► MarketplaceOffer ──► ProviderProfile
  ├── 1:N ──► TrackingEvent
  ├── 1:N ──► VerificationCode
  ├── 1:N ──► ProofRecord ──► UploadedFile
  ├── 1:N ──► Payment ──► EscrowTransaction
  ├── 1:N ──► DispatchAssignment ──► Rider ──► Agency
  ├── 1:1 ──► ProviderSelection
  └── 1:N ──► ReviewRating ──► ProviderProfile (rating recalculated)

VerificationRecord ──► UploadedFile (encrypted document)
Agency ──► AgencyMember ──► User
Agency ──► AgencySubscription ──► SubscriptionPlan

ProviderProfile ──► ProviderBranch ──► Quarter (company branch offices)
ProviderProfile ──► RiderRoute ──► Quarter × 2 (origin + destination, named relations)
```

---

## 7. API Reference

### Base URL
`http://localhost:4000/api/v1` (development)

### Response Envelope
All responses are wrapped in:
```json
{
  "success": true,
  "data": { ... }
}
```

Errors:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message"
  }
}
```

Or for class-validator errors:
```json
{
  "success": false,
  "message": ["phone must be a valid phone number", "..."]
}
```

The frontend `apiClient` handles both formats — it tries `body.message` first, then walks into `body.error.message` for the nested object format.

### Auth Endpoints
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ fullName, phone, email?, password, role }` | `{ user, tokens }` |
| POST | `/auth/login` | `{ phone?, email?, password }` | `{ user, tokens }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |

### Location Endpoints (all Public)
| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/locations/regions` | — | `Region[]` |
| GET | `/locations/towns` | `regionId` | `Town[]` |
| GET | `/locations/quarters` | `townId` | `Quarter[]` |

### Provider Profile Endpoints
| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/provider-profiles` | Provider | CreateProviderProfileDto |
| GET | `/provider-profiles` | Public | `?page&limit&providerType&baseCity&verificationStatus&availabilityStatus&isFeatured` |
| GET | `/provider-profiles/:id` | Public | — |
| GET | `/provider-profiles/me/stats` | Provider | — |
| PATCH | `/provider-profiles/me` | Provider | UpdateProviderProfileDto |
| PATCH | `/provider-profiles/me/availability` | Provider | `{ availabilityStatus }` |
| POST | `/provider-profiles/me/verification-records` | Provider | `{ verificationType, documentFileId, submittedValue }` |
| POST | `/provider-profiles/me/branches` | Provider (company) | `{ name, quarterId, phoneNumber?, isHeadquarters? }` |
| GET | `/provider-profiles/me/branches` | Provider (company) | List own branches with full location hierarchy |
| GET | `/provider-profiles/me/branches/:id/stats` | Provider (company) | `{ activeCount, completedCount }` for the branch's town |
| DELETE | `/provider-profiles/me/branches/:id` | Provider (company) | Soft-delete a branch |
| POST | `/provider-profiles/me/routes` | Provider (rider) | `{ originQuarterId, destinationQuarterId, departureTime?, isRecurring?, recurringDays? }` |
| GET | `/provider-profiles/me/routes` | Provider (rider) | List own planned routes with origin/destination labels |
| GET | `/provider-profiles/me/routes/:id/matching-jobs` | Provider (rider) | Open requests compatible with this route (up to 30) |
| DELETE | `/provider-profiles/me/routes/:id` | Provider (rider) | Soft-delete a planned route |

### Delivery Request Endpoints (additions — Phase 3)
| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/delivery-requests/:id/abandon` | Provider | `{ agreedToTerms: true, reason: string (10–500 chars) }` |
| POST | `/delivery-requests/track/:code/cancel` | Public | `{ reason?: string (max 500 chars) }` |

### Intelligence Endpoints (all Public)
| Method | Path | Body |
|---|---|---|
| POST | `/intelligence/cost-prediction` | `{ itemType, distanceKm, weightKg?, fragile?, providerRate?, historicalDeliveries?, currency? }` |
| POST | `/intelligence/provider-recommendations` | `{ providers: ProviderCandidateDto[], limit?, maxDistanceKm? }` |
| POST | `/intelligence/route-matches` | Route matching input |
| POST | `/intelligence/dispatch-suggestions` | Dispatch suggestion input |

### Upload Endpoints
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/upload` | Provider | `multipart/form-data` with `file` field + optional `documentPurpose` |
| GET | `/upload/:fileId` | JWT | — (returns binary stream) |

---

## 8. Frontend Architecture — Next.js 15

### Route Structure

```
app/
├── layout.tsx                         Root layout (fonts, metadata, CSS)
├── page.tsx                           Home page / landing
│
├── auth/
│   ├── login/page.tsx                 Provider login form
│   └── register/page.tsx             Provider registration form
│
├── providers/
│   ├── page.tsx                       Provider directory (public)
│   └── [providerId]/page.tsx         Individual provider public profile
│
├── track/
│   └── [trackingCode]/page.tsx       Public delivery tracking page
│
├── request/
│   ├── page.tsx                       Request wizard entry (step 0 — start / select type)
│   └── [draftId]/
│       ├── type/page.tsx              Delivery type selection
│       ├── route/page.tsx             Pickup + destination quarters picker
│       ├── item/page.tsx              Item details (name, category, weight, fragile)
│       ├── provider/page.tsx          Provider selection (recommendation, search, marketplace)
│       ├── contact/page.tsx           Customer contact information
│       ├── review/page.tsx            Summary review before submission
│       ├── payment/page.tsx           Payment initiation
│       └── success/page.tsx          Confirmation + tracking code display
│
├── customer/
│   └── contact/page.tsx              Customer contact management (for authenticated users)
│
├── (provider)/                        Provider portal (layout-guarded)
│   ├── layout.tsx                     ProviderGuard + ProviderNav
│   └── provider/
│       ├── dashboard/page.tsx         Stats, earnings, recent activity
│       ├── requests/page.tsx          Tabs: Active | Offers | Marketplace | Direct
│       ├── marketplace/page.tsx       Browse open marketplace jobs
│       ├── profile/
│       │   ├── create/page.tsx        First-time profile setup wizard
│       │   ├── edit/page.tsx         Profile editing form (display name, description, phone, type-specific fields, pricing tiers)
│       │   └── me/page.tsx           View own profile + verification + branch management (company) / routes link (rider)
│       ├── routes/page.tsx           Rider planned routes — create, list, view matching jobs per route
│       └── agents/page.tsx           Manage sub-agents / riders (company providers)
│
└── (admin)/                           Admin portal (layout-guarded)
    ├── layout.tsx                     AdminGuard + AdminNav
    └── admin/
        ├── page.tsx                   Dashboard (9-metric KPI board)
        ├── providers/page.tsx         Provider list + filter
        ├── requests/page.tsx          All delivery requests
        ├── users/page.tsx             User list
        └── verifications/page.tsx    Verification queue (approve / reject)
```

### Layout System

**Root layout** (`app/layout.tsx`) — Applies fonts and global CSS. No auth logic.

**`(provider)` route group layout** — Wraps all `/provider/*` routes with:
1. `ProviderGuard` — client component that checks Zustand hydration and role. Redirects unauthenticated or non-provider users to `/auth/login`.
2. `ProviderNav` — sidebar/topbar navigation for the provider portal.

**`(admin)` route group layout** — Wraps all `/admin/*` routes with:
1. `AdminGuard` — same pattern as ProviderGuard but checks for `admin` role.
2. `AdminNav` — admin sidebar navigation.

### State Management — Zustand

**`auth-store.ts`** — Persisted to `localStorage` under key `deligo-auth`.

```typescript
{
  user: AuthUser | null,          // id, fullName, phone, roles[]
  accessToken: string | null,
  refreshToken: string | null,
  _hasHydrated: boolean,          // SSR guard — prevents redirect flash
  setAuth(user, tokens): void,
  clearAuth(): void,
  selectIsAuthenticated: boolean,
  selectIsAdmin: boolean,         // roles.includes('admin')
  selectIsProvider: boolean,      // roles.includes('provider')
}
```

The `_hasHydrated` flag is set in `onRehydrateStorage`. All auth guards and the `AuthRedirect` component wait for this flag before making routing decisions, preventing a flash-of-redirect on first render.

**`contact-store.ts`** — Persisted. Stores the current session's `CustomerContact` ID and details so the customer doesn't have to re-enter them for a second request.

**`recent-requests-store.ts`** — Persisted. Stores the last few tracking codes the user has visited.

### API Client (`lib/api-client.ts`)

A thin wrapper around `fetch()` with:
- Automatic `Authorization: Bearer <token>` header injection (reads from `localStorage`).
- Automatic 401 handler — clears auth state and redirects to `/auth/login?next=<currentPath>`.
- Error extraction that handles both top-level `body.message` and nested `body.error.message` formats (both are used by NestJS depending on which exception class is thrown).
- Methods: `get<T>`, `post<T>`, `patch<T>`, `delete<T>`, `upload<T>` (multipart).

### AuthRedirect Component

An invisible client component mounted in the home page (`/`). After Zustand hydrates:
- If user is admin → `router.replace('/admin')`
- If user is provider → `router.replace('/provider/dashboard')`
- Otherwise → stays on home page

### Request Wizard Flow

The multi-step delivery request creation uses `[draftId]` as the URL segment. The draft ID is a UUID generated on the client and stored in Zustand until the final submission step.

Steps in order:
1. `/request` — Entry point, generates draft ID, redirects to first step
2. `/request/[draftId]/type` — Customer selects delivery type (includes `medication_delivery`)
3. `/request/[draftId]/route` — Customer picks pickup and destination using the 3-step modal (Region → Quarter → Landmark). Both sides are constrained to the same region (same-region enforcement). For `medication_delivery`, pickup is optional.
4. `/request/[draftId]/item` — For standard types: customer describes items (name, category, weight, fragile flag, quantity). For `medication_delivery`: only a "Medication / Prescription Description" textarea is shown; physical item fields are hidden.
5. `/request/[draftId]/provider` — Customer selects fulfillment mode and provider (if applicable)
6. `/request/[draftId]/contact` — Customer enters contact details (WhatsApp, name, email) — creates `CustomerContact`
7. `/request/[draftId]/review` — Summary of the full request before final submission
8. `/request/[draftId]/payment` — Payment initiation (mobile money)
9. `/request/[draftId]/success` — Confirmation showing tracking code and a link to `/track/<code>`

### Provider Request Page — Tabs and Workflow Stepper

`/provider/requests` has four tabs:
- **Active** — Requests currently assigned to this provider. Shows a `WorkflowStepper` component with 4 steps: Assigned → Collected → In Transit → Delivered. The active step is highlighted with a primary colour ring glow and drop shadow. Each active card also has a "Cancel delivery" link that expands an **inline abandonment panel** (see Provider Abandonment below).
- **Offers (Bids)** — Bids submitted by this provider awaiting customer decision.
- **Completed** — Delivered, completed, and cancelled requests.
- **Direct** — Direct requests from customers awaiting acceptance/rejection.

#### Provider Abandonment UI (Inline Panel)

When a provider needs to abandon an active delivery, they click the discreet "Cancel delivery" text link in the bottom-right of the request card. This expands a collapsible section within the same card (no page navigation required):

1. **Liability warning box** — Lists three acknowledgements:
   - Provider confirms they are NOT in possession of the parcel
   - Provider accepts financial/legal liability if found guilty of parcel-related issues
   - Provider accepts a reliability score impact

2. **Checkbox** — "I have read and agree to the above terms, and I confirm I do not hold the parcel." The confirm button remains disabled until this is checked.

3. **Reason textarea** — Minimum 10 characters required. A character counter shows in green when the minimum is met.

4. **Action buttons** — "Confirm cancellation" (danger outline, disabled until both conditions met) and "Keep delivery" (closes the panel without action).

5. On success, `onAbandoned()` callback fires which calls `load()` to refresh the full request list. The cancelled request disappears from the Active tab (it is no longer assigned to this provider).

### Tracking Page (`/track/[trackingCode]`)

Public page, no authentication required.

**Components:**
1. **Status card** — Current status badge, route details, item count, estimated cost, created date.
2. **Provider Offers card** — Only shown for open marketplace requests with pending bids. Customer accepts or rejects each offer.
3. **Delivery Progress card** — Contains:
   - `DeliveryProgressStepper` — 5-step horizontal stepper (Created → Assigned → Collected → In Transit → Delivered). Done steps are green with checkmarks; the active step has a primary-colour ring glow and shadow; upcoming steps are outlined gray.
   - Activity log — Timestamped list of all `TrackingEvent` records. Phase 3 events `PROVIDER_ABANDONED` and `REQUEST_CANCELLED` are mapped to human-readable labels.
   - Terminal status banner — For `cancelled`, `disputed`, `expired`.
4. **Rate Your Delivery card** — Only shown when `requestStatus` is `delivered` or `completed`.
   - If no review yet: star rating buttons + comment textarea + Submit button.
   - If review exists: displays the review (star row + rating out of 5 + comment in quotes) with an "Edit review" link.
   - Edit mode: pre-populates form with existing rating/comment, shows "Save changes" and "Cancel" buttons, calls `PATCH` endpoint on submit.
5. **Cancel Request card** — Only shown when `requestStatus` is `draft`, `created`, `marketplace_open`, or `offers_received` (i.e., no provider has accepted yet).
   - Starts collapsed showing "No provider has accepted this request yet" with a "Cancel request" link.
   - On click, expands an inline section: warning that the action is permanent, optional reason textarea, "Yes, cancel request" button (danger styling), and "Keep request" button.
   - On confirmation, calls `POST /delivery-requests/track/:code/cancel`. On success, the SSE update and `loadData()` call refresh the status to `cancelled`.

**Real-time updates:**
- On mount, opens an `EventSource` connection to `GET /delivery-requests/track/:code/events`.
- On each non-ping SSE frame, silently calls `loadData(true)` (no loading spinner).
- On unmount, closes the `EventSource`.
- The connection sends a 30-second ping frame to prevent browser connection timeouts.

### Rider Routes Page (`/provider/routes`)

Available to independent riders only. Linked from `ProviderNav` and from the "My Routes" quick-action on the rider's dashboard.

**Route creation form (inline, not a modal):**
1. Origin town picker → origin quarter picker (cascades: loads quarters on town selection)
2. Destination town picker → destination quarter picker
3. Departure time (`<input type="time">`)
4. Recurring toggle (`isRecurring` checkbox)
5. Day selector — 7 pills (Mon–Sun) that toggle on/off when `isRecurring` is enabled
6. Submit calls `POST /provider-profiles/me/routes`

**Route list:**
Each route card shows origin quarter → destination quarter, departure time, recurring days, and a "View matching jobs" toggle button. Clicking it calls `GET /provider-profiles/me/routes/:id/matching-jobs` and renders up to 30 job cards inline below the route. Each job card shows:
- Tracking code + delivery type
- Pickup → destination route text
- Item names summary
- Fragile badge (if any item is fragile)
- Desired reward amount (if set by customer)

A delete button on each route card soft-deletes it via `DELETE /provider-profiles/me/routes/:id` and removes it from local state.

### Provider Profile — Branch Management (`/provider/profile/me`)

The profile page is role-aware:
- **Company providers** — see a "Branch Locations" card after their profile info. Shows a list of existing branches (each with name, quarter, town, optional phone, HQ badge). An inline "Add branch" form expands with a town → quarter cascade picker, branch name, phone, and "Set as headquarters" checkbox.
- **Independent riders** — see a "Planned Routes" card with a link to `/provider/routes`.

Branch management uses local React state — no full page reload on add or delete. On successful `createBranch`, the new branch is prepended to the list. If `isHeadquarters: true`, all other branches' HQ flags are cleared in local state. On `deleteBranch`, the branch is filtered from local state.

### Provider Dashboard — Branch Stats (`/provider/dashboard`)

Company providers see a "Branch Overview" grid showing each branch's `activeCount` and `completedCount` (requests in that branch's town). Data is loaded by calling `getMyBranches()` then `getBranchStats(branchId)` for each branch in parallel. If no branches exist yet, a prompt card links to `/provider/profile/me` to add the first branch.

Riders see a "My Routes" quick action card on the dashboard instead of the "My Bids" card.

---

## 9. Key Business Flows

### 9.1 Customer Delivery Request Creation (Full Flow)

```
Customer visits /request
        │
        ▼
Selects delivery type (document, parcel, medication, etc.)
        │
        ▼
Same-region enforcement:
  • Once either pickup or destination quarter is selected, both pickers
    are locked to that region. The other side can only choose quarters
    within the same region.
  • "Change region" resets both sides.

For medication_delivery:
  • Destination quarter + landmark required
  • Pickup is optional (provider sources medication from any pharmacy)

For all other types:
  • Both pickup and destination quarter + landmark required
        │
        ▼
Describes items (name, weight, fragile flag)

For medication_delivery:
  • Item name / category / weight / size / fragile hidden
  • "Medication / Prescription Description" textarea required instead
  • Category, size, fragile fields are hidden; only special instructions remain
        │
        ▼
Selects fulfillment mode:
  ┌─────────────────────────┬────────────────────────────────────┐
  │ open_marketplace        │ Customer sets desired price.        │
  │                         │ No provider selected yet.           │
  ├─────────────────────────┼────────────────────────────────────┤
  │ recommended_provider    │ System ranks available providers.   │
  │                         │ Customer selects from ranked list.  │
  ├─────────────────────────┼────────────────────────────────────┤
  │ search_provider         │ Customer searches/browses and picks │
  │                         │ a specific provider.               │
  ├─────────────────────────┼────────────────────────────────────┤
  │ agency_dispatch         │ Customer picks an agency.           │
  │                         │ Agency internally assigns a rider. │
  └─────────────────────────┴────────────────────────────────────┘
        │
        ▼
Enters contact info (or reuses saved contact)
→ POST /customer-contacts (or uses existing)
        │
        ▼
Reviews summary
        │
        ▼
POST /delivery-requests
→ Server generates tracking code (DLG-XXXXXX)
→ Estimates delivery cost (region-based formula)
→ Creates DeliveryRequest + RequestRoute + RequestItem(s)
→ Status: created / marketplace_open
        │
        ▼
Payment step (mobile money — future)
        │
        ▼
/request/[draftId]/success
→ Tracking code displayed
→ Link to /track/<code>
```

### 9.2 Open Marketplace Flow

```
Request status: marketplace_open
        │
Provider sees job on /provider/marketplace
        │
        ├── Provider bids: POST /delivery-requests/:id/bid
        │     → MarketplaceOffer created (status: submitted)
        │     → Request status → offers_received
        │     → TrackingEventsService.emit() → customer's SSE stream updates
        │
        └── Provider takes directly: POST /delivery-requests/:id/take
              → Provider assigned immediately
              → Request status → provider_assigned

Customer sees offers on /track/<code>
        │
Customer accepts: POST /delivery-requests/track/:code/offers/:id/accept
        → Offer status → accepted
        → All other offers → rejected
        → DeliveryRequest.selectedProviderProfileId = offer.providerProfileId
        → DeliveryRequest.acceptedOfferId = offer.id
        → Request status → provider_assigned
        → TrackingEventsService.emit()
```

### 9.3 Provider Delivery Workflow

```
Status: provider_assigned
Provider is notified (dashboard notification)
        │
Provider records: POST /delivery-requests/:id/workflow/collect
        → TrackingEvent: PARCEL_COLLECTED
        → Status: pickup_verified
        → SSE push to tracking page
        │
Provider records: POST /delivery-requests/:id/workflow/start_transit
        → TrackingEvent: IN_TRANSIT
        → Status: in_transit
        → SSE push to tracking page
        │
Provider records: POST /delivery-requests/:id/workflow/arrive
        → TrackingEvent: ARRIVED_DESTINATION
        → Status unchanged (still in_transit)
        → SSE push (optional notification only)
        │
Provider records: POST /delivery-requests/:id/workflow/deliver
        → TrackingEvent: DELIVERED
        → Status: delivered
        → SSE push to tracking page
        │
Customer or system → Status: completed
```

### 9.4 Review Submission Flow

Reviews are stored as `ReviewRating` records and surfaced on the public provider listing. The `ProviderProfileCard` component (`frontend/src/features/provider-profile/provider-profile-card.tsx`) is a client component that auto-slides through up to two recent reviews:

- **Single review:** displayed statically.
- **Multiple reviews:** a `ReviewSlider` sub-component runs a `setInterval(7000)` to advance the visible review every 7 seconds. Dot indicators at the top-right allow manual navigation. The interval is cleared on unmount.

```
Request status: delivered or completed
Customer visits /track/<code>
        │
"Rate Your Delivery" card appears
        │
        ├── First review:
        │     Customer clicks stars (1–5), writes comment (optional)
        │     POST /delivery-requests/track/:code/review { rating, comment }
        │     → ReviewRating created
        │     → ProviderProfile.ratingAverage and ratingCount recalculated
        │     → loadData() refreshes → data.review is now non-null → form replaced by review display
        │
        └── Edit review:
              Customer clicks "Edit review"
              Form pre-populated with existing rating + comment
              Customer changes values
              PATCH /delivery-requests/track/:code/review { rating, comment }
              → ReviewRating updated
              → Provider rating recalculated
              → loadData() refreshes → updated review displayed
```

### 9.5 Provider Verification Flow

```
Provider registers (POST /auth/register)
        │
Creates profile (POST /provider-profiles)
→ verificationStatus: unverified
        │
Provider uploads documents via Verification Modal:

For independent_rider:
  1. Profile photo (IdentityVerificationType.profile)
  2. National ID number (text input)
  3. National ID front image (IdentityVerificationType.national_id, submittedValue: "<number> (front)")
  4. National ID back image (IdentityVerificationType.national_id, submittedValue: "<number> (back)")

For courier_company / logistics_company:
  1. Business registration document
  2. Agency/company document

Each document:
  → POST /upload (multipart) → file encrypted with AES-256-GCM → stored in Supabase
  → POST /provider-profiles/me/verification-records
     { verificationType, documentFileId, submittedValue }
  → VerificationRecord.status: pending
  → ProviderProfile.verificationStatus: pending (if first submission)
        │
Admin visits /admin/verifications
→ GET /provider-profiles/admin/verification-records
        │
Admin reviews document (decrypted on download via GET /upload/:fileId)
        │
Admin decision:
  Approve → PATCH /provider-profiles/admin/verification-records/:id { status: 'approved' }
  Reject  → PATCH /provider-profiles/admin/verification-records/:id { status: 'rejected', rejectionReason }
        │
Final verification status update:
  PATCH /provider-profiles/admin/:id/verification { verificationStatus: 'verified' }
  → Provider phone number becomes visible on public listings
  → Provider appears as "Verified" on provider cards
```

### 9.6 Real-Time Tracking — SSE Architecture

```
Backend: TrackingEventsService (singleton, @Injectable)
  └── Node EventEmitter with setMaxListeners(0)

Whenever a status-changing mutation completes in DeliveryRequestService:
  this.trackingEvents.emit(request.publicTrackingCode)
  → emitter.emit(`tracking:${code}`)

This triggers all subscribers on that event name:

SSE endpoint: GET /delivery-requests/track/:code/events
  └── Observable<MessageEvent> from TrackingEventsService.createStream(code)
        ├── emitter.on(`tracking:${code}`, handler)
        │     → subscriber.next({ data: { event: 'update', code } })
        └── setInterval 30s
              → subscriber.next({ data: { event: 'ping' } })
        └── teardown: emitter.off + clearInterval

Browser (tracking page):
  const es = new EventSource(`/api/v1/delivery-requests/track/${code}/events`)
  es.onmessage = (event) => {
    parse JSON → if ping, skip
    else → loadData(true)   // silent refresh, no spinner
  }
  // cleanup: es.close() on component unmount
```

Seven service methods emit SSE events:
1. `acceptOffer` — when customer accepts a marketplace bid
2. `acceptDirectRequest` — when provider accepts a direct assignment
3. `takeRequest` — when provider directly claims a marketplace request
4. `bidOnRequest` — when a provider submits a new bid (triggers customer notification that an offer has arrived)
5. `recordWorkflowAction` — on every workflow step (collect, start_transit, arrive, deliver)
6. `abandonDelivery` — when a provider abandons an accepted delivery (request returns to open market)
7. `cancelByTrackingCode` — when a customer cancels a pre-assignment request

### 9.7 Provider Abandonment Flow

```
Status: provider_assigned | pickup_verified | in_transit
Provider opens /provider/requests (Active tab)
        │
Provider clicks "Cancel delivery" link on the request card
→ Inline abandonment panel expands within the card
        │
Provider reads liability terms:
  1. Not in possession of parcel
  2. Accepts liability if found guilty
  3. Reliability score will be affected
        │
Provider checks agreement checkbox
Provider types reason (min 10 chars)
        │
POST /delivery-requests/:id/abandon
{ agreedToTerms: true, reason: "..." }
        │
Server validates:
  ✓ Provider is the assigned provider
  ✓ Status ∈ { provider_assigned, pickup_verified, in_transit }
  ✓ agreedToTerms === true
  ✓ reason.length >= 10
        │
Prisma transaction:
  1. acceptedOffer.status → 'withdrawn'
  2. Clear provider fields on request
  3. requestStatus → 'marketplace_open'
  4. fulfillmentMode → 'open_marketplace'
  5. Create TrackingEvent: PROVIDER_ABANDONED (notes = reason)
  6. SSE emit → tracking page updates in real time

Provider's Active tab refreshes → request disappears
Customer's tracking page shows PROVIDER_ABANDONED event in activity log
Request re-appears in /provider/marketplace for all providers
```

### 9.8 Customer Cancellation Flow

```
Status: draft | created | marketplace_open | offers_received
Customer visits /track/<code>
        │
"Cancel request" card appears at bottom of page (collapsed)
        │
Customer clicks "Cancel request" link
→ Card expands with confirmation panel
        │
Customer optionally types a reason
Customer clicks "Yes, cancel request"
        │
POST /delivery-requests/track/:code/cancel
{ reason?: "..." }
        │
Server validates:
  ✓ Status ∈ { draft, created, marketplace_open, offers_received }
  ✓ (No provider assigned — implicit from status check)
        │
Prisma transaction:
  1. All submitted offers → 'expired'
  2. requestStatus → 'cancelled'
  3. Record cancelledAt timestamp
  4. Create TrackingEvent: REQUEST_CANCELLED
  5. SSE emit

SSE triggers loadData(true) on the tracking page
→ DeliveryProgressStepper shows terminal status banner "Cancelled"
→ Cancel card is no longer rendered (status no longer cancellable)
```

### 9.9 Branch-Boosted Provider Recommendation

```
Customer at /request/[draftId]/provider step
        │
Wizard sends:
GET /delivery-requests/recommended-providers
  ?pickupQuarterId=<uuid>
  &destinationQuarterId=<uuid>
        │
Server:
  1. Look up pickupQuarter → pickupTownId
     Look up destinationQuarter → destinationTownId
  2. Query all active ProviderBranch records where
     quarter.townId IN [pickupTownId, destinationTownId]
  3. Build map: providerProfileId → nearestBranchName
  4. For each recommended provider:
       if providerProfileId in map → score += 12
                                  → nearbyBranchName = branch.name
  5. Sort by score (descending)
  6. Return ranked list

Customer sees providers with local offices surfaced higher
Provider cards show "Branch nearby: Akwa Agency" (etc.)
```

### 9.11 Admin Bootstrap Flow

```
Before first deployment:
  1. Generate a strong secret: openssl rand -hex 32
  2. Add to .env: ADMIN_BOOTSTRAP_SECRET=<generated_secret>
  3. Deploy

After deployment, from any REST client:
  POST /api/v1/admin/bootstrap
  Headers: { "X-Bootstrap-Secret": "<generated_secret>" }
  Body: { "fullName": "Admin Name", "phone": "+237600000000", "email": "admin@deligo.cm", "password": "strongpassword" }

Server validates:
  1. Header matches env var → pass
  2. COUNT(users WITH admin role) === 0 → pass (else 403 Forbidden)
  3. Creates User + UserRole(admin) with argon2-hashed password

After success:
  4. Remove ADMIN_BOOTSTRAP_SECRET from .env and redeploy
  5. Even if re-added later, the DB check (step 2) permanently disables it
```

---

## 10. Security Architecture

### Authentication — JWT

- **Algorithm:** HS256 in development (configurable via `auth.config.ts`).
- **Token structure:**
  ```json
  {
    "sub": "<userId>",
    "roles": ["provider"],
    "iat": 1718000000,
    "exp": 1718086400
  }
  ```
- Tokens are stored client-side in `localStorage` under key `deligo-auth` (Zustand persist).
- The backend never receives `refreshToken` in normal flows — it is only used at the `/auth/refresh` endpoint.

### Authorization — Role-Based Access Control

Three roles: `customer`, `provider`, `admin`.

Decorator usage:
```typescript
@Public()       // Skip JWT entirely
@Roles(RoleCode.Provider)   // Require 'provider' role
@Roles(RoleCode.Admin)      // Require 'admin' role
// No decorator = any authenticated user
```

`OptionalJwtAuthGuard` — used on `POST /delivery-requests` — attempts JWT but does not fail if absent. Allows both anonymous and authenticated customers to create requests.

### File Encryption

All uploaded files (provider verification documents) are encrypted before leaving the Node.js process:

```
plaintext buffer
    │
    ▼ AES-256-GCM
    ├── Key: 32-byte hex from APP_ENCRYPTION_KEY env var (loaded at startup)
    ├── IV: 12 bytes, crypto.randomBytes(12) — unique per file
    └── Auth tag: 16 bytes — appended to ciphertext

ciphertext = encrypt(plaintext, key, iv)
→ upload to Supabase as application/octet-stream
→ store iv in UploadedFile.encryptionIv

On download:
ciphertext ← Supabase
plaintext = decrypt(ciphertext, key, iv from DB)
→ return to authorized requester
```

If `APP_ENCRYPTION_KEY` is rotated, old files can still be decrypted as long as their IV is in the database. Key rotation requires a re-encryption pass (not yet implemented).

### Input Validation

- All DTOs use `class-validator` decorators.
- `ValidationPipe` is applied globally with `whitelist: true` (strips unknown properties) and `forbidNonWhitelisted: true`.
- Phone numbers are normalized via `normalizeCameroonPhone()` before comparison or storage to prevent duplicates from different formats of the same number.

### Soft Deletes

All major entities have a `deletedAt` timestamp. No records are hard-deleted. All queries filter `WHERE deletedAt IS NULL`.

---

## 11. Intelligence Layer

The Intelligence module provides four stateless computation services. None of them access the database directly — they operate on data passed by the caller.

### Provider Recommendation Scoring

Score components (total weight = 100%):

| Component | Weight | Formula |
|---|---|---|
| Distance | 20% | `1 - (distanceKm / maxDistanceKm)` clamped to [0,1] |
| Price | 22% | `cheapestPrice / providerPrice` clamped to [0,1] |
| Availability | 16% | Binary: 1 or 0 |
| Rating | 16% | `rating / 5` |
| Verification | 16% | Numeric 0–1 passed by caller |
| Reliability | 10% | Completion rate (default 0.65) |

Final score: weighted sum, rounded to 4 decimal places.

Labels applied to top providers:
- `Cheapest` — lowest price among all candidates
- `Fastest` — lowest estimated minutes
- `Highly Verified` — `verificationLevel >= 0.9`
- `Top Rated` — `rating >= 4.5`

**Branch proximity boost (Phase 3):** Before the Intelligence module scores are applied, the `DeliveryRequestService.recommendProviders()` method adds a flat **+12 points** to any provider who has a `ProviderBranch` in the same town as the request's pickup or destination quarter. This pre-scoring happens in the service layer (not inside the Intelligence module, which remains stateless) and the result is passed into the ranking as the starting score for those providers.

### Cost Prediction Confidence

- `0.48` when no historical data is available
- Increases with `clamp(0.55 + count/50, 0.55, 0.86)` as historical deliveries accumulate
- Maximum confidence: 86% (the model acknowledges inherent uncertainty in last-mile logistics)

---

## 12. File Upload and Storage System

### Upload Flow

```
Client: POST /upload (multipart/form-data, field: "file")
        │
UploadController (Provider JWT required)
        │
        ▼
UploadService.upload()
  1. Validate file size ≤ 10 MB
  2. Validate MIME type ∈ { image/jpeg, image/png, image/webp, application/pdf }
  3. Generate fileId = randomUUID()
  4. Compute SHA-256 checksum of plaintext buffer
  5. Encrypt: CryptoService.encrypt(buffer) → { ciphertext, iv }
  6. Upload: SupabaseService.upload(objectKey, ciphertext, 'application/octet-stream')
  7. Create UploadedFile record in DB with iv, checksum, storageUrl, etc.
  8. Return { id, objectKey, storageUrl, ... }
        │
        ▼
VerificationRecord.documentFileId = uploaded file ID
```

### Download Flow

```
Client: GET /upload/:fileId  (JWT required)
        │
UploadController
  → AdminController or UploadController handles access check
        │
UploadService.getFileContent(fileId, requestingUserId)
  1. Load UploadedFile record from DB
  2. Check access: owner OR has providerProfileId (admin check enforced at controller)
  3. SupabaseService.download(objectKey) → ciphertext Buffer
  4. CryptoService.decrypt(ciphertext, iv) → plaintext Buffer
  5. Return { buffer, mimeType }
        │
Controller sets Content-Type and streams buffer
```

### Supabase Storage Configuration

- **Bucket:** `deligo-documents`
- **Key:** Service role key (`SUPABASE_SERVICE_KEY`) — bypasses all Row Level Security policies
- **Visibility:** All objects are private. Download happens through the backend, never directly from Supabase URLs exposed to the browser.
- **upsert: true** — allows re-uploading the same object key without error (used when a provider re-submits a document).

---

## 13. Real-Time Tracking (SSE)

Server-Sent Events is a one-directional HTTP/1.1 streaming protocol where the server pushes newline-delimited JSON frames to the browser. Unlike WebSockets, SSE:
- Works through most HTTP proxies without configuration
- Automatically reconnects on connection drop
- Uses standard HTTP — no upgrade handshake

### Frame format

**Update frame (status changed):**
```
data: {"event":"update","code":"DLG-RH7N9N"}

```

**Keepalive frame (every 30s):**
```
data: {"event":"ping"}

```

### Connection management
- `TrackingEventsService` uses a single Node.js `EventEmitter` with `setMaxListeners(0)` to allow unlimited concurrent SSE connections per tracking code.
- Each SSE stream subscribes to a dedicated event named `tracking:<CODE>`.
- The teardown function (RxJS Observable cleanup) removes the listener and clears the keepalive interval when the client disconnects or the component unmounts.
- Multiple browser tabs or devices can simultaneously track the same code — each gets its own stream but they all fire from the same in-process event.

---

## 14. Financial Architecture

The financial layer is fully modelled in the database schema but not yet integrated with a real payment gateway. The architecture is designed for Mobile Money (MTN MoMo and Orange Money) — the dominant payment methods in Cameroon.

### Payment Flow (designed, not yet live)

```
Customer confirms request
        │
POST /payments/initiate
→ Payment record created (status: initiated)
→ DeliveryRequest.paymentStatus → initiated
        │
Mobile money API called (MTN MoMo / Orange Money)
→ Customer's phone receives payment prompt
→ Customer confirms on their phone
        │
Payment gateway webhook → POST /payments/webhook/:reference
→ Payment.paymentStatus → confirmed
→ DeliveryRequest.paymentStatus → confirmed
→ DeliveryRequest.requestStatus → created / marketplace_open
→ EscrowTransaction created (status: held)
```

### Escrow Model

| Step | EscrowStatus |
|---|---|
| Payment confirmed | `held` |
| Delivery confirmed | `released` |
| Dispute raised | `disputed` |
| Refund issued | `refunded` |
| Partial resolution | `partially_released` |

### Wallet Architecture

Each provider and each agency has a `Wallet` record. After escrow release:
- `EscrowTransaction.providerAmount` is credited to the provider's wallet
- `EscrowTransaction.platformFee` is retained by DeliGo
- A `WalletTransaction` record of type `credit` is created

Payout: a `WalletTransaction` of type `payout` is created and the wallet's `availableBalance` is decremented.

### Commission Rules

The `CommissionRule` table allows flexible commission configuration:
- By `deliveryType` (e.g., higher commission on intercity deliveries)
- By `providerType` (e.g., lower commission for verified companies)
- As `percentage` or `fixed` amount
- With `minFee` / `maxFee` caps
- With date-range effectiveness (so rates can change without touching code)

---

## 15. Notification System

### Current State
The `NotificationService` is a stub — it creates `Notification` records in the database with `status: pending` but does not yet send them externally.

### Notification Channels (designed)
- `dashboard` — In-app notification shown in the provider portal
- `whatsapp` — WhatsApp Business API message to the customer's `whatsappNumber`
- `email` — Transactional email (Mailgun / SendGrid)
- `sms` — SMS via local Cameroonian SMS gateway

### Notification Types (planned)
- `request_created` → Customer: tracking code and summary
- `offer_received` → Customer: a provider has bid on their request
- `provider_assigned` → Customer: delivery is confirmed
- `parcel_collected` → Customer: provider has picked up
- `in_transit` → Customer: parcel is on its way
- `delivered` → Customer: parcel delivered, invite to review
- `new_direct_request` → Provider: customer selected them directly
- `new_marketplace_job` → Providers in area: new open job available
- `provider_abandoned` → Customer: their assigned provider cancelled; request is back on the market
- `request_cancelled` → Confirmation to customer that their request has been cancelled

---

## 16. Environment Configuration

The backend validates all environment variables at startup using a Zod schema in `src/config/env.schema.ts`. The application will refuse to start if any required variable is missing or invalid.

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET` | Secret key for signing access tokens |
| `JWT_EXPIRY` | Access token TTL (e.g., `15m`, `1h`) |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (e.g., `7d`, `30d`) |
| `APP_ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM file encryption |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (full access, bypasses RLS) |
| `SUPABASE_BUCKET` | Storage bucket name (default: `deligo-documents`) |

### Optional Variables

| Variable | Description |
|---|---|
| `PORT` | API server port (default: 4000) |
| `NODE_ENV` | `development`, `production`, `test` |
| `CORS_ORIGIN` | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `ADMIN_BOOTSTRAP_SECRET` | One-time secret for admin account creation — **remove after first use** |

### Frontend Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `https://api.deligo.cm/api/v1`) |

---

## 17. Database Migrations

Migrations are managed by Prisma Migrate. Each migration is an immutable SQL file stored in `prisma/migrations/`.

### Applied Migrations

| Migration ID | Description |
|---|---|
| `20260618173701_add_customer_contact_user_link` | Added nullable `user_id` FK column to `customer_contacts` |
| `20260618191330_add_customer_contact_phone` | Added nullable `phone` column to `customer_contacts` |
| `20260619101051_add_location_hierarchy_update_request_route` | Created `regions`, `towns`, `quarters` tables; updated `request_routes` to use quarter FKs instead of raw text |
| `20260619160028_add_upload_encryption_fields` | Added `is_encrypted` and `encryption_iv` columns to `uploaded_files` |
| `20260621120449_add_provider_branches_rider_routes` | Created `provider_branches` and `rider_routes` tables; added back-relations on `quarters` and `provider_profiles` |
| `add_provider_pricing_tiers` | Added nullable `price_in_town` and `price_in_region` DECIMAL(12,2) columns to `provider_profiles` |

### Seed Data

**`prisma/seeds/locations.seed.ts`** — Seeds the full Cameroonian geographic hierarchy (regions, towns, quarters) including:
- Regions: Centre, Littoral, West, South West, North West, South, East, Adamawa, North, Far North
- Major towns per region
- Quarters within each town

**`prisma/seed.ts`** — Development seed: creates sample users, providers, and requests for testing.

**`prisma/seed-admin.ts`** — Production helper: creates the first admin account (alternative to the bootstrap endpoint for CI/CD environments).

---

## 18. Deployment Topology

### Current Development Setup

```
Developer Machine:
  ├── npm run start:dev  (NestJS, port 4000)
  └── npm run dev  (Next.js, port 3000)

External services:
  ├── Supabase (PostgreSQL + Storage)
  └── localhost PostgreSQL (alternative)
```

### Planned Production Setup

```
Internet
    │
    ▼
CDN / Edge (Vercel)
    ├── Next.js frontend (auto-scaled, edge-cached)
    └── /api/v1/* proxy → NestJS backend
            │
            ▼
    NestJS API (Railway / Render)
    └── Connected to:
          ├── PostgreSQL on Supabase (primary database)
          └── Supabase Storage (encrypted documents)
```

### CORS Configuration

The backend is configured with `CORS_ORIGIN` env var. In development this is `http://localhost:3000`. In production it should be the Vercel deployment URL. The `ConfigModule` validates this at startup.

---

## Appendix: Key Code Locations

| Concern | File |
|---|---|
| Database schema | `prisma/schema.prisma` |
| App bootstrap | `src/main.ts`, `src/app.module.ts` |
| Env validation | `src/config/env.schema.ts` |
| JWT strategy | `src/modules/auth/jwt.strategy.ts` |
| Global guards | `src/common/guards/jwt-auth.guard.ts`, `roles.guard.ts` |
| Tracking code generation | `src/modules/delivery-request/delivery-request.service.ts:22` |
| Status machine | `src/modules/delivery-request/delivery-request.service.ts` — `recordWorkflowAction()`, `acceptOffer()` |
| SSE pub/sub | `src/modules/delivery-request/tracking-events.service.ts` |
| File encryption | `src/common/services/crypto.service.ts` |
| Supabase client | `src/common/services/supabase.service.ts` |
| Upload service | `src/modules/upload/upload.service.ts` |
| Cost prediction | `src/modules/intelligence/cost-prediction.service.ts` |
| Provider scoring | `src/modules/intelligence/provider-recommendation.service.ts` |
| Admin bootstrap | `src/modules/admin/bootstrap.controller.ts`, `admin.service.ts` |
| Auth store (frontend) | `frontend/src/features/auth/auth-store.ts` |
| API client (frontend) | `frontend/src/lib/api-client.ts` |
| Request wizard | `frontend/src/app/request/[draftId]/` |
| Tracking page | `frontend/src/app/track/[trackingCode]/page.tsx` |
| Provider card | `frontend/src/features/provider-profile/provider-profile-card.tsx` |
| Verification modal | `frontend/src/components/ui/verification-modal.tsx` |
| Route definitions | `frontend/src/lib/routes.ts` |
