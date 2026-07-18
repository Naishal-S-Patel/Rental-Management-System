# `<APP_NAME>` — Rental Management System · PRD

> **Product name:** placeholder `<APP_NAME>` until decided. Backend package root stays
> `com.hackathon.starter` (renaming it is pure churn) — only the human-facing name (app title,
> OpenAPI title, email templates) changes once a name is picked.

Status: **Round 1 decisions locked in below.** A few of your answers required an interpretation
to turn into a concrete design — every one of those is called out explicitly under
**"Interpretation"** so you can correct it in one pass rather than it silently becoming assumed
truth. **Open Questions – Round 2** at the bottom are what's left before DB design can start for
real.

---

## 0. Context: What We're Building On

### 0.1 Stub Capabilities Reused (not rebuilt)

The stub is a complete auth/account foundation. The rental system is built **on top** of it,
reusing every cross-cutting concern rather than re-inventing them:

| Stub capability | How the rental system reuses it |
|---|---|
| JWT auth (stateless access+refresh, `tokenVersion` revocation) | All rental endpoints sit behind it unchanged |
| Role-based access (`SecurityConfig` matchers + `@EnableMethodSecurity`) | Rental authz maps onto the renamed roles (§1) |
| `User` + profile (`/api/users/me`, change-password) | Extended into the Customer profile; profile image via storage-service |
| `storage-service` (local S3 clone) + `StorageController` proxy | Product images, profile photos, invoice PDFs, damage/inspection photos |
| Async email (Thymeleaf + `@Async` executor) | Order confirmation, pickup/return reminders, overdue notices, receipts |
| `TokenCleanupScheduler` pattern | New `OverdueDetectionScheduler` for auto-detecting late returns |
| `MlClient` / `MlController` (declarative `@HttpExchange` stub) | Placeholder for bonus AI: availability forecasting, route optimization, predictive maintenance |
| `GlobalExceptionHandler`, `RequestLoggingFilter`, `LoggingAspect`, rate limiting, OpenAPI conventions | Applied uniformly to all new controllers/services |
| OAuth2 (Google) | Kept as dead-but-intact code per your instruction — no rental flow depends on it |

**Design principle carried forward:** every new controller method gets full
`@Operation`/`@ApiResponses`, every DTO gets Jakarta validation + `@Schema`, every custom
exception gets a real throw site + handler, and every `hasRole(...)` rule gets a real endpoint
behind it. No dead config.

### 0.2 Rental Lifecycle at a Glance

The two entry paths (portal self-service + admin in-store) converge on one `RentalOrder` state
machine — this was the single most important architectural call, locked in as Q3 (§2):

```
                 ┌─────────── Admin (in-store) ───────────┐
                 │  create Quotation → confirm → Invoice   │
Browse/Cart ─────┤                                          ├──► CONFIRMED RENTAL ORDER
(portal user)    │  online: cart → checkout → pay+deposit   │        │
                 └──────────────────────────────────────────┘        │
                                                                      ▼
   QUOTATION → CONFIRMED → PAID(+deposit held) → PICKUP/DELIVERED → ACTIVE
                                                                      │
                                            on-time ◄─────────────────┤─────────────► late
                                               │                                        │
                                       RETURNED → inspect                       overdue detected
                                               │                                        │
                                     full deposit refunded              penalty = f(overdue, rules)
                                               │                        deduct from deposit,
                                            CLOSED                       refund remainder → CLOSED
```

This is the quick-reference version; the authoritative, fully-named state machine (with the exact
`OrderStatus` enum values) is [SYSTEM_DESIGN.md §4](SYSTEM_DESIGN.md#4-order-lifecycle--state-machine).

### 0.3 Feature Modules

Each module maps to a PDF section and is tagged **[Core]** (required) or **[Bonus]**. Every
module is a standard `entity → repository → service → controller + DTOs` vertical slice following
the stub's conventions. Updated inline where a Round-1 decision (§1–§9) has since resolved what
was originally an open question here.

**4.1 Product Catalog & Attributes [Core]** — PDF §5, Admin responsibilities
- Product CRUD (admin); rentable flag, description, base pricing linkage, images (storage-service).
- **Variants**: Brand, Manufacturer, Color, Size — as configurable attributes → variant combinations.
- Product availability model: quantity-based, tracked per variant (§3 — decided).
- Public browse/search endpoints for portal users; admin management endpoints.

**4.2 Pricing: Pricelists & Rental Periods [Core]** — PDF §5
- One **default pricelist** applies to all products.
- Multiple additional pricelists; some **time-bound** (valid date range).
- **Rental periods/durations** (hourly / daily / weekly / monthly) with per-duration pricing.
- Price resolution: oldest-created pricelist wins on conflict (§5 — decided, interpretation flagged).

**4.3 Quotations [Core]** — PDF §3 Backend, Admin
- Admin creates quotation (esp. for in-store walk-ins), quotation lines, validity window.
- **Quotation templates** for fast creation; configurable **header & footer**.
- Confirm quotation → generates a `RentalOrder` + invoice (this *is* the admin-confirmation step
  for in-store orders — see §2).

**4.4 Cart & Rental Orders [Core]** — PDF §2/§4
- Portal user: cart (add product + variant + rental period), delivery-address **or** store-pickup
  selection.
- Checkout → `RentalOrder`, entering `PENDING_ADMIN_CONFIRMATION` — **every** order, online or
  in-store, requires explicit admin confirmation (§2 — decided).
- Order line items, rental start/end, fulfillment method.
- Order history & management (portal + admin views).

**4.5 Payments & Invoicing [Core]** — PDF §2/§3/§7
- Capture payment (rental amount **+ security deposit**) via **Razorpay** (§8 — decided, real
  gateway, not simulated).
- **Invoice generation** + **downloadable invoice** PDF via storage-service (§9 — decided).
- Automatic invoice generation for late fees (§7).

**4.6 Security Deposit Management [Core]** — PDF §2 (Deposit)
- Collect deposit at confirmation; **fixed amount, set per product** (§6 — decided).
- Track deposit payment status; **hold** until successful return.
- On-time return → **full refund**; late → **deduct penalty, refund remainder** (cash per PDF).
- **Complete deposit history/ledger** (append-only deposit transactions).

**4.7 Late Return Fee Management [Core]** — PDF §3 (Late Fee)
- **Automatic overdue detection** via scheduler (reuses `TokenCleanupScheduler` pattern →
  `OverdueDetectionScheduler`).
- Daily **compounding** % of original product price × days late, with **grace period** + a
  cap decoupled from the deposit amount (§7 — decided).
- Penalty calculation → deduct from deposit → auto-invoice → visibility of outstanding penalties.

**4.8 Pickup & Return Management [Core + some Bonus]** — PDF §4
- **Pickup:** daily schedule, pickup confirmation, checklist, customer notifications.
  *Route/sequence planning* + *barcode/QR* = **[Bonus]**.
- **Return:** daily schedule, **condition inspection**, **damage reporting**, **missing-accessories
  verification**, return confirmation.
- On return: **automatic stock update**, **deposit settlement**, late-fee calc, **repair-workflow
  initiation** when damaged (depth still open — §12).

**4.9 Rental Operations Dashboard [Core]** — PDF §1 (Dashboard)
Read/aggregation endpoints (admin): Active Rentals · Due Today · Upcoming Pickups · Upcoming
Returns · Overdue Rentals · Revenue · Deposits Held · Late-Fee Collection. *Customizable widgets /
KPI analytics* = **[Bonus]**.

**4.10 Customer / Profile Management [Core]** — PDF §4
- Extends stub's `/api/users/me`: profile fields, **profile image** (storage-service), **multiple
  shipping/delivery addresses**, order history.

**4.11 Admin Configuration [Core]** — PDF §3
- Org-wide rental settings: default deposit rule, late-fee rules, grace period, pickup/return
  config, quotation template + header/footer. Single-org assumed — still open (§12).

**4.12 Notifications [Core, thin]**
- Reuse async email for: signup verification (exists), order confirmation, pickup reminder,
  return-due reminder, overdue notice, deposit-refund receipt. Which events are in-scope — still
  open (§12).

**4.13 Bonus / AI hooks [Bonus]** — PDF §6
- Predictive maintenance · availability forecasting · smart route optimization · IoT tracking —
  all routed through the existing `MlClient` stub. Scope-now-vs-later still open (§12).

### 0.4 Architecture Sketch

Layered Spring Boot, identical shape to the stub — new code slots into new packages parallel to
the existing ones. The full, current version of this (now including Razorpay, the availability
engine, and every new package) lives in
[SYSTEM_DESIGN.md §2](SYSTEM_DESIGN.md#2-package-architecture); this is the original intent
snapshot, kept for quick reference:

```
com.hackathon.starter
├── controller/     + product, pricing, quotation, order, cart, payment,
│                     deposit, latefee, pickup, return, dashboard, address, adminconfig
├── service/        (business logic; @Transactional; SLF4J; LoggingAspect-instrumented)
├── repository/     (Spring Data JPA; UUID PKs for externally-exposed entities)
├── entity/         (JPA; ddl-auto=update per stub convention)
├── dto/request|response/  (records + Jakarta validation + @Schema)
├── mapper/         (ModelMapper, isolated like UserMapper)
├── enums/          (OrderStatus, DepositStatus, FulfillmentMethod, LateFeeUnit, ...)
├── exception/      (new custom types — each with a real throw site + handler entry)
├── scheduler/      + OverdueDetectionScheduler
└── client/         (MlClient/StorageClient reused for images, invoices, AI)
```

Cross-cutting, all reused unchanged:
- **Security:** every rental endpoint authenticated; admin/config endpoints `hasRole(ADMIN)`;
  customer endpoints scoped to `principal.getId()` (same pattern `StorageController` uses to
  prevent cross-user access). Method-level `@PreAuthorize` where path-based matching isn't enough.
- **Files:** all binary assets (product images, profile photos, invoice PDFs, damage photos) go
  through `StorageController` → storage-service. Backend never touches disk directly.
- **Money:** `BigDecimal` for all monetary fields (never `double`), currency/tax decision pending
  (§12).
- **Validation:** deposit rules, date ranges (start<end), rental-period validity enforced with
  Jakarta constraints + service-layer guards throwing `BadRequestException`.
- **Consistency:** deposit settlement + penalty + refund + stock update happen inside a single
  `@Transactional` service method so a rental never ends up half-settled.
- **Auditability:** deposit and penalty tables are append-only ledgers, not mutated-in-place
  balances.

Data ownership sketch (entities named, columns fully specified in
[DB_SCHEMA.md](DB_SCHEMA.md)): `Product`, `ProductVariant`, `AttributeType`/`AttributeValue`,
`Pricelist`, `PricelistItem`, `RentalPeriod`, `Quotation`/`QuotationLine`/`QuotationTemplate`,
`Cart`/`CartItem`, `RentalOrder`/`RentalOrderLine`, `Address`, `Invoice`, `Payment`,
`SecurityDeposit`/`DepositTransaction`, `Penalty`, `Pickup`, `Return`/`DamageReport`,
`RentalSettings`.

---

## 1. Roles

| Role | Source | Scope |
|---|---|---|
| `ADMIN` | stub, unchanged | Full backend/config access, org-wide rental management, quotations, confirmations, pickup/return, deposit/penalty settlement, dashboard |
| `CUSTOMER` | replaces stub's `ROLE1` | Portal self-service: browse, cart, checkout, order history, addresses, profile, invoices |

**Decision (Q1):** exactly two roles. `ROLE2`/`ROLE3`/`ROLE4` and their `SecurityConfig`
matchers + `RoleController` placeholder endpoints are dropped when this gets implemented — per
the stub's own rule, a `hasRole(...)` matcher with no real endpoint behind it isn't allowed to
exist. OAuth2's `DEFAULT_OAUTH2_ROLE` becomes `CUSTOMER`.

**Interpretation needed:** the earlier draft floated a `STAFF/OPERATOR` role for the pickup/
return/inspection desk, separate from full `ADMIN`. Your answer says just two roles, so **all
pickup/return/inspection/confirmation actions require `ADMIN`** — there is no separate operator
account. Flag if that's wrong; it's a one-enum-value change either way, cheap to revisit.

---

## 2. Order Lifecycle (the spine)

**Decision (Q3): every order — online or in-store — must pass explicit Admin confirmation.**
There is no auto-confirm-on-payment path for the portal checkout.

```
DRAFT (cart)
   │  customer checkout  OR  admin creates quotation (in-store)
   ▼
PENDING_ADMIN_CONFIRMATION
   │  admin reviews availability/terms
   ├─── rejected ──► CANCELLED
   ▼
CONFIRMED  (invoice generated)
   │  Razorpay payment: rental amount + security deposit
   ▼
PAID  (deposit held)
   ▼
SCHEDULED_PICKUP ──► PICKED_UP / ACTIVE
   │
   ├── on-time return ──► RETURNED → INSPECTED → full deposit refund → CLOSED
   └── overdue detected ──► RETURNED (late) → INSPECTED →
                             penalty computed → deducted from deposit →
                             remainder refunded (cash, per PDF) → CLOSED
```

**Confirmed:** admin confirmation happens *before* payment. The customer submits a rental request,
admin confirms it (checks availability, may adjust), *then* the invoice + Razorpay payment link
is generated and the customer pays. No refund-on-reject path is needed since payment never
happens before confirmation.

---

## 3. Inventory & Availability

**Decision (Q4): quantity-based inventory, tracked per variant** ("n number of quantities domain
wise" → each distinct sellable unit — a product/variant combination — carries its own stock
count, not serialized/unique physical units).

- `Product` — base info (name, description, category, base price, images via storage-service).
- `ProductVariant` — a concrete combination of attribute values (Brand, Manufacturer, Color,
  Size per PDF §5) with its own `totalQuantity`. A product with no variant axes gets one implicit
  default variant.
- **Availability for a date range** = `totalQuantity − Σ(quantity reserved by orders whose
  [start,end] overlaps the requested range and whose status is CONFIRMED/PAID/ACTIVE)`.

---

## 4. Rental Period Selection

**Decision (Q5): both.** Two ways to land on the same start/end date range on an order line:
1. **Free-form dates** — customer/admin picks any start + end date.
2. **Admin-defined Rental Period templates** (e.g. "Weekend", "1 Week", "1 Month") — a named
   shortcut that pre-fills the duration; still resolves to concrete start/end dates.

Both paths write to the same `startDate`/`endDate` fields on the order line — the "period" is
just how those dates got chosen, not a separate data shape downstream.

---

## 5. Pricing

**Pricelists:** one default pricelist applies to all products; admins can create additional
pricelists, some scoped to a specific validity window (time-bound), per PDF §5.

**Decision (Q8): conflict resolution by pricelist age.** When more than one pricelist could
apply to a given product/date, **the pricelist that was created earliest (`createdAt` ascending)
wins.**

**Confirmed:** oldest-created pricelist wins, not customer-tenure/loyalty pricing. No
customer-segment → pricelist mapping feature is in scope.

---

## 6. Security Deposit

**Decision (Q7): fixed deposit amount**, not percentage-based.

**Confirmed:** "fixed" is set **per product** (admin configures a deposit amount when
creating/editing a product — mirrors "Maintain pricelist, Late fees, Deposit amount... of the
Rental Products" in PDF §3), not one global number applied to every order regardless of what's
being rented.

- Deposit collected at confirmation, alongside rental payment (Razorpay).
- Held until product is returned.
- On-time return → full refund, no deduction.
- Late return → penalty (see §7) deducted, remainder refunded in cash per PDF.
- **Deposit ledger is append-only** — hold, deduction, refund are separate recorded
  transactions, not in-place balance edits — so "maintain complete deposit history" (PDF §2) is
  a real query, not a derived guess.

---

## 7. Late Return Fee

**Decision (Q6): daily percentage accrual, compounding.** Confirmed: the fee compounds daily
rather than accruing linearly. Formula (standard compound-interest shape, applied to the overdue
balance):

```
lateDays = max(0, days(actualReturnDate) - days(dueDate) - settings.gracePeriodDays)
compoundedFee = basePrice × ((1 + dailyLateFeePercentage)^lateDays − 1)
cappedFee = min(compoundedFee, basePrice × settings.maxLateFeeMultiplier)
```

- **Grace period** (PDF §3) still applies before accrual starts — days within grace don't count
  as late.
- **Max late-fee cap** (PDF §3) is its own configurable setting — `maxLateFeeMultiplier`
  (e.g. `2.00` = fee can never exceed 2× the product's base price) — **decoupled from the deposit
  amount**, not implicitly capped at whatever the deposit happens to be.
- Config scope: **global default** on `RentalSettings`, not per-product.

**Interpretation flagged (formula specifics — not separately asked, but load-bearing):**
"compounding" needs a base to compound against; I'm using the standard reading — each day's fee
is `dailyLateFeePercentage` applied to the *running overdue balance* (`basePrice` growing by that
% each day), not compounding on top of zero. Flag if you intended a different mechanic (e.g.
compounding only on the previously-accrued fee portion, excluding the original price).

**Penalty exceeding deposit — resolved by cross-referencing the PDF itself, not just assumed:**
PDF §3 lists **"Clear visibility of outstanding penalties"** as its own bullet, separate from
"deduct from deposit" — which only makes sense if a penalty *can* exceed the deposit and leave a
tracked remainder. So: `cappedFee` is deducted from the deposit up to the deposit's full amount;
any excess (`cappedFee − deposit.amount`, when positive) is **not** forced-collected — it's
recorded as an **outstanding `LATE_FEE` invoice** (§9's existing invoice mechanism, `type =
LATE_FEE`), visible on the admin dashboard's "Late Fee Collection" widget (PDF §1) as unpaid.
Collecting that outstanding balance (a second Razorpay charge, dunning, etc.) is out of scope for
this build unless you say otherwise.

---

## 8. Payments — Razorpay

**Decision (Q2): Razorpay**, real gateway (not simulated).

Implementation approach — **flagged for your confirmation**, since it's a deviation from the
stub's existing "no OpenFeign, no heavy SDKs, use RestClient + `@HttpExchange`" convention
(`MlClient`, `StorageClient`):

- **Recommended:** use the official `com.razorpay:razorpay-java` SDK rather than hand-rolling a
  `@HttpExchange` client, specifically because Razorpay webhook payloads must be
  signature-verified (HMAC-SHA256 against the webhook secret) and the SDK provides this
  out-of-the-box — reimplementing it by hand is a real security footgun, not boilerplate worth
  avoiding.
- New `PaymentController`/`PaymentService`: create Razorpay order → return order id + key to
  frontend → frontend completes checkout via Razorpay's client SDK → **webhook** endpoint
  receives payment confirmation (must be added to `SecurityConfig`'s `PUBLIC_ENDPOINTS` list,
  since Razorpay calls it unauthenticated — signature verification *is* the auth for that route).
  Order only moves `CONFIRMED → PAID` on a **verified** webhook event, never on a client-side
  "success" callback alone (client callbacks are spoofable).
- Deposit refunds (full or partial-after-penalty) go through Razorpay's Refunds API.
- New secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — same
  `${ENV_VAR}` placeholder convention as existing secrets, never hardcoded.

---

## 9. Invoicing

**Decision (Q9): downloadable invoice**, confirmed (matches PDF §2 "user can download the
invoice from the portal").

- Server-generates a PDF (Thymeleaf HTML → PDF, consistent with how email templates already work
  — needs one added dependency, e.g. OpenPDF or Flying Saucer, since nothing in the stub does
  HTML→PDF today).
- Stored via **storage-service**, same pattern as product images/profile photos — backend never
  touches disk directly.
- Downloaded through the existing `/api/storage/{fileId}/content` proxy pattern
  (`StorageController`), scoped to the owning customer.
- Auto-generated invoices also required for late-fee penalties (PDF §3) — same mechanism, triggered
  at return-settlement time rather than at order confirmation.

---

## 10. Confirmed Decisions — Summary Table

| # | Topic | Decision |
|---|---|---|
| Q1 | Roles | `ADMIN` + `CUSTOMER` only |
| Q2 | Payments | Razorpay (real gateway) |
| Q3 | Order confirmation | **Every** order (online or in-store) requires explicit admin confirmation before payment |
| Q4 | Inventory | Quantity-based, tracked per product variant |
| Q5 | Rental period | Both free-form dates and admin-defined period templates supported |
| Q6 | Late fee | Daily **compounding** % of product price, capped by a separate `maxLateFeeMultiplier`; excess over deposit becomes an outstanding `LATE_FEE` invoice |
| Q7 | Deposit | Fixed amount, set **per product** (confirmed) |
| Q8 | Pricelist conflicts | **Oldest-created pricelist wins** (confirmed) |
| Q9 | Invoice | Downloadable PDF via storage-service |
| — | Order confirm/pay order | **Confirm before payment** (confirmed) |

---

## 11. Feature Modules

See [§0.3](#03-feature-modules) for the full module list (4.1–4.13), [§0.1](#01-stub-capabilities-reused-not-rebuilt)
for reused stub components, and [§0.4](#04-architecture-sketch) for the package-layout sketch —
all updated inline with the decisions recorded in §1–§9.

---

## 12. Open Questions — Round 3

Round 2's four highest-impact schema questions are now resolved (§2, §5, §6, §7). What's left,
roughly in order of how much they'd change already-written code if answered differently:

1. **Late-fee compounding mechanic** — confirm the "compounds on the growing balance including
   original price" reading in §7, vs. compounding only the accrued-fee portion.
2. **Razorpay approach** — confirm official SDK is acceptable (deviates from the
   RestClient/`@HttpExchange`-only convention, justified in §8 by webhook signature verification).
3. **Damage handling depth** — can damage/missing-accessory cost also deduct from deposit
   alongside late fees (stacking with the outstanding-penalty mechanism in §7)? Is the "repair
   workflow" (PDF §4) just a status flag, or a tracked repair record with its own lifecycle?
4. **Currency & tax** — single currency (INR, given Razorpay)? Do invoices need GST/tax line
   items, or tax-free for this build?
5. **Delivery logistics depth** — for "deliver to address," do we manage delivery
   scheduling/status, or just capture the choice + address and treat fulfillment operationally
   (i.e., admin marks it delivered, no route/carrier tracking)?
6. **Notification events** — which of {order confirmation, pickup reminder, return-due reminder,
   overdue notice, refund receipt, outstanding-penalty notice} should send email in this phase?
7. **Bonus/AI scope now vs. later** — predictive maintenance, route optimization, availability
   forecasting, IoT tracking, barcode/QR — any of these scaffolded through the existing `MlClient`
   stub in this phase, or all deferred?
8. **Tenancy** — single organization (one global `RentalSettings` row), correct?

None of these block starting entity/repository/service implementation for the modules already
fully specified (catalog, pricing, cart, orders, payments, deposits) — they mainly affect the
pickup/return/damage and notification modules. Answer whenever convenient; I'll flag if any
specific implementation step needs one first.
