# Backend API Endpoint Reference

Generated from the actual `Backend/starter` controller source (not the aspirational catalog in
[SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) §9 — this reflects what's implemented today). See
[SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for architecture/rationale and [DB_SCHEMA.md](DB_SCHEMA.md)
for entity design.

Base URL: `http://localhost:8080` (starter app, port 8080). All paths below are relative to that,
already include `/api`.

## Conventions

- 🔒 = requires `Authorization: Bearer <accessToken>`. Role shown in parentheses where narrower
  than "any authenticated user" — enforced centrally in `SecurityConfig`, not per-endpoint
  `@PreAuthorize`.
- "own data only" = the userId/ownership is derived from the JWT principal
  (`@AuthenticationPrincipal UserPrincipal`) server-side; it is never trusted from the request
  body/path, and admins bypass the ownership check.
- Status codes listed are the ones each endpoint's `@ApiResponses` actually documents (see
  `GlobalExceptionHandler` for the shared 400/401/403/404/409/429/500 bodies, all `ErrorResponse`).
- Request/response types are the `record` DTOs in `dto/request/` and `dto/response/`.

---

## 1. Auth — `/api/auth` (all public, no JWT)

| Method | Path | Rate-limited | Request | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | ✅ `signupLimiter` | `SignupRequest` | `MessageResponse` (201) | sends async verification email; `role` must be a self-assignable role, `ADMIN` cannot be self-assigned |
| POST | `/api/auth/login` | ✅ `loginLimiter` | `LoginRequest` | `AuthResponse` (200) | 401 bad credentials, 403 unverified account |
| POST | `/api/auth/refresh` | — | `RefreshTokenRequest` | `AuthResponse` (200) | rotates both tokens; rejected if `tokenVersion` claim is stale (revoked) |
| POST | `/api/auth/logout` | — | 🔒 | `MessageResponse` (200) | stateless no-op — client just discards tokens |
| POST | `/api/auth/logout-all-devices` | — | 🔒 | `MessageResponse` (200) | bumps `User.tokenVersion`, invalidates every outstanding access+refresh token |
| POST | `/api/auth/verify` | — | `VerifyEmailRequest` | `MessageResponse` (200) | |
| POST | `/api/auth/resend-verification` | ✅ `resendVerificationLimiter` | `ResendVerificationRequest` | `MessageResponse` (200) | always 200, doesn't leak account existence |
| POST | `/api/auth/forgot-password` | ✅ `forgotPasswordLimiter` | `ForgotPasswordRequest` | `MessageResponse` (200) | always 200, doesn't leak account existence |
| POST | `/api/auth/reset-password` | — | `ResetPasswordRequest` | `MessageResponse` (200) | |
| POST | `/api/auth/oauth2/exchange` | — | `OAuth2ExchangeRequest` | `AuthResponse` (200) | exchanges a one-time 60s opaque code (minted after Google OAuth2 redirect) for a real token pair |

## 2. Users — `/api/users` 🔒 (self-service only)

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/users/me` | — | `UserResponse` | |
| PUT | `/api/users/me/profile` | `UpdateProfileRequest` | `UserResponse` | first/last name |
| PUT | `/api/users/me/photo` | multipart `file` | `UserResponse` | stored via `FileStorageService`, scoped to principal's id |
| PUT | `/api/users/me/password` | `ChangePasswordRequest` | `MessageResponse` | also bumps `tokenVersion`, revoking every other session |

## 3. Addresses — `/api/addresses` 🔒 (own data only)

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/addresses` | — | `List<AddressResponse>` | current user's addresses |
| POST | `/api/addresses` | `AddressRequest` | `AddressResponse` (201) | first address created becomes default |
| PUT | `/api/addresses/{id}` | `AddressRequest` | `AddressResponse` | 404 if not owner |
| DELETE | `/api/addresses/{id}` | — | 204 | |
| PUT | `/api/addresses/{id}/default` | — | `AddressResponse` | marks as default shipping address |

## 4. Products, Variants, Attributes

Browse (`GET`) is any authenticated user; writes are 🔒 **ADMIN**.

| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/products` | 🔒 | query: `category?`, `search?`, `Pageable` | `Page<ProductResponse>` | |
| GET | `/api/products/{id}` | 🔒 | — | `ProductResponse` | includes variants |
| POST | `/api/products` | 🔒 ADMIN | `ProductRequest` | `ProductResponse` (201) | name, description, category, basePrice, securityDepositAmount |
| PUT | `/api/products/{id}` | 🔒 ADMIN | `ProductRequest` | `ProductResponse` | |
| DELETE | `/api/products/{id}` | 🔒 ADMIN | — | 204 | soft-delete (`active=false`) |
| POST | `/api/products/{id}/images` | 🔒 ADMIN | multipart `file` | `ProductResponse` | via `FileStorageService` |
| GET | `/api/products/{id}/variants` | 🔒 | — | `List<ProductVariantResponse>` | incl. per-variant stock |
| POST | `/api/products/{id}/variants` | 🔒 ADMIN | `ProductVariantRequest` | `ProductVariantResponse` (201) | sku, totalQuantity, attributeValueIds |
| PUT | `/api/variants/{id}` | 🔒 ADMIN | `ProductVariantRequest` | `ProductVariantResponse` | |
| DELETE | `/api/variants/{id}` | 🔒 ADMIN | — | 204 | soft-delete |
| GET | `/api/attributes` | 🔒 ADMIN | — | `List<AttributeTypeResponse>` | attribute types + their values |
| POST | `/api/attributes` | 🔒 ADMIN | `AttributeTypeRequest` | `AttributeTypeResponse` (201) | |
| POST | `/api/attributes/{id}/values` | 🔒 ADMIN | `AttributeValueRequest` | `AttributeValueResponse` (201) | |

## 5. Pricelists & Rental Periods

| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/pricelists` | 🔒 ADMIN | — | `List<PricelistResponse>` | |
| POST | `/api/pricelists` | 🔒 ADMIN | `PricelistRequest` | `PricelistResponse` (201) | name, validFrom/validTo (nullable = unbounded), isDefault |
| PUT | `/api/pricelists/{id}` | 🔒 ADMIN | `PricelistRequest` | `PricelistResponse` | |
| DELETE | `/api/pricelists/{id}` | 🔒 ADMIN | — | 204 | cannot delete the default pricelist |
| POST | `/api/pricelists/{id}/items` | 🔒 ADMIN | `PricelistItemRequest` | `PricelistItemResponse` (201) | productVariantId, durationUnit, unitPrice |
| DELETE | `/api/pricelists/{id}/items/{itemId}` | 🔒 ADMIN | — | 204 | |
| GET | `/api/rental-periods` | 🔒 | — | `List<RentalPeriodResponse>` | any authenticated user |
| POST | `/api/rental-periods` | 🔒 ADMIN | `RentalPeriodRequest` | `RentalPeriodResponse` (201) | name, durationValue, durationUnit |
| PUT | `/api/rental-periods/{id}` | 🔒 ADMIN | `RentalPeriodRequest` | `RentalPeriodResponse` | |
| DELETE | `/api/rental-periods/{id}` | 🔒 ADMIN | — | 204 | |

## 6. Quotations — 🔒 ADMIN only (in-store, admin-initiated)

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/quotations` | query: `status?`, `Pageable` | `Page<QuotationResponse>` | |
| GET | `/api/quotations/{id}` | — | `QuotationResponse` | |
| POST | `/api/quotations` | `QuotationRequest` (customerId, quotationTemplateId, validUntil, lines) | `QuotationResponse` (201) | |
| PUT | `/api/quotations/{id}` | `QuotationRequest` | `QuotationResponse` | only while `DRAFT`/`SENT` |
| POST | `/api/quotations/{id}/confirm` | — | `OrderResponse` | converts to `RentalOrder` in `CONFIRMED` (skips `PENDING_ADMIN_CONFIRMATION`) + invoice |
| POST | `/api/quotations/{id}/reject` | — | `QuotationResponse` | terminal |
| GET | `/api/quotation-templates` | — | `List<QuotationTemplateResponse>` | |
| POST | `/api/quotation-templates` | `QuotationTemplateRequest` | `QuotationTemplateResponse` (201) | name, header, footer, terms |
| PUT | `/api/quotation-templates/{id}` | `QuotationTemplateRequest` | `QuotationTemplateResponse` | |
| DELETE | `/api/quotation-templates/{id}` | — | 204 | |

## 7. Cart — `/api/cart` 🔒 **CUSTOMER**

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/cart` | — | `CartResponse` | current user's cart |
| POST | `/api/cart/items` | `CartItemRequest` (productVariantId, quantity, startDate, endDate, rentalPeriodId) | `CartResponse` | advisory availability check |
| PUT | `/api/cart/items/{id}` | `CartItemRequest` | `CartResponse` | change qty/dates |
| DELETE | `/api/cart/items/{id}` | — | 204 | |
| POST | `/api/cart/checkout` | `CheckoutRequest` (fulfillmentMethod, deliveryAddressId) | `OrderResponse` | creates order in `PENDING_ADMIN_CONFIRMATION`, clears cart |

## 8. Orders — `/api/orders` 🔒 (core lifecycle)

| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/orders` | 🔒 | query: `status?`, `Pageable` | `Page<OrderResponse>` | customer sees own; admin sees all |
| GET | `/api/orders/{id}` | 🔒 own/ADMIN | — | `OrderResponse` | |
| POST | `/api/orders/{id}/confirm` | 🔒 ADMIN | — | `OrderResponse` | `PENDING_ADMIN_CONFIRMATION → CONFIRMED`; authoritative availability re-check; generates invoice |
| POST | `/api/orders/{id}/reject` | 🔒 ADMIN | `OrderRejectRequest?` | `OrderResponse` | `→ CANCELLED` |
| POST | `/api/orders/{id}/cancel` | 🔒 own only | — | `OrderResponse` | owning customer only, only while `PENDING_ADMIN_CONFIRMATION` |
| POST | `/api/orders/{id}/payment` | 🔒 CUSTOMER | — | `PaymentInitiateResponse` | `@RateLimiter(paymentLimiter)`; initiates Razorpay order for a `CONFIRMED` order |
| GET | `/api/orders/{id}/payments` | 🔒 own/ADMIN | — | `List<PaymentResponse>` | payment history |
| GET | `/api/orders/{id}/deposit` | 🔒 own/ADMIN | — | `SecurityDepositResponse` | |
| GET | `/api/orders/{id}/deposit/transactions` | 🔒 own/ADMIN | — | `List<DepositTransactionResponse>` | full HOLD/DEDUCTION/REFUND ledger |
| GET | `/api/orders/{id}/invoices` | 🔒 own/ADMIN | — | `List<InvoiceResponse>` | rental invoice + any late-fee invoice |

## 9. Payments — `/api/payments`

| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/payments/webhook` | public\* | raw `String` body + `X-Razorpay-Signature` header | 200/400 | \*no JWT — authenticity via HMAC signature verification inside the controller; `CONFIRMED → PAID` |

## 10. Pickup & Return — 🔒 ADMIN only

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/pickups` | query: `date?` (defaults today) | `List<PickupResponse>` | daily schedule |
| POST | `/api/orders/{id}/pickup/schedule` | `PickupScheduleRequest` (scheduledDate) | `PickupResponse` | `PAID → SCHEDULED_PICKUP` |
| POST | `/api/orders/{id}/pickup/confirm` | `PickupConfirmRequest?` (checklistNotes) | `PickupResponse` | `SCHEDULED_PICKUP → ACTIVE`, decrements stock, creates return record |
| GET | `/api/returns` | query: `date?` (defaults today) | `List<ReturnResponse>` | daily schedule |
| POST | `/api/orders/{id}/return/confirm` | `ReturnConfirmRequest` (conditionNotes, damageReported, missingAccessories) | `ReturnResponse` | `ACTIVE → RETURNED` |
| POST | `/api/orders/{id}/return/settle` | — | `OrderResponse` | runs `DepositSettlementService`: late fee → deduction → refund → stock increment → invoice → `SETTLED → CLOSED` |
| POST | `/api/orders/{id}/damage-report` | multipart: `description`, `estimatedCost`, `photos[]?` | `DamageReportResponse` (201) | feeds settlement |

## 11. Invoices — 🔒 (own invoices, or any if ADMIN)

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/api/orders/{orderId}/invoices` | `List<InvoiceResponse>` | see §8 |
| GET | `/api/invoices/{id}/download` | raw PDF bytes | ownership re-verified via the invoice's parent order |

## 12. Dashboard — `/api/dashboard` 🔒 **ADMIN**

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/api/dashboard/summary` | `DashboardSummaryResponse` | active rentals, due today, upcoming pickups/returns, overdue count, revenue, deposits held, late-fee collection |
| GET | `/api/dashboard/overdue` | `List<OverdueOrderResponse>` | detail list backing the overdue widget |

## 13. Admin Settings & Misc

| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/admin/rental-settings` | 🔒 ADMIN | — | `RentalSettingsResponse` | grace period, daily late-fee %, max late-fee multiplier, pickup/return windows |
| PUT | `/api/admin/rental-settings` | 🔒 ADMIN | `RentalSettingsRequest` | `RentalSettingsResponse` | |
| GET | `/api/admin/ping` | 🔒 ADMIN | — | `MessageResponse` | health-check |
| POST | `/api/ml/predict` | 🔒 | `MlPredictRequest` | `MlPredictResponse` | placeholder passthrough to future FastAPI ML service |
| GET | `/api/files/{fileId}` | 🔒 | — | raw bytes | generic authenticated download for locally-stored images/photos; no per-file ownership check by design — the access boundary is whichever endpoint handed the `fileId` out |

---

## Authorization matrix (as enforced in `SecurityConfig`)

| Path pattern | Rule |
|---|---|
| `PUBLIC_ENDPOINTS` (see §1 table + webhook + swagger/actuator) | `permitAll()` |
| `/api/admin/**` | `hasRole("ADMIN")` |
| `/api/attributes/**` | `hasRole("ADMIN")` |
| `/api/pricelists/**` | `hasRole("ADMIN")` |
| `/api/quotations/**`, `/api/quotation-templates/**` | `hasRole("ADMIN")` |
| `/api/pickups/**`, `/api/returns/**` | `hasRole("ADMIN")` |
| `/api/dashboard/**` | `hasRole("ADMIN")` |
| `/api/cart/**` | `hasRole("CUSTOMER")` |
| GET `/api/products/**`, `/api/variants/**`, `/api/rental-periods/**` | `authenticated()` (any role) |
| POST/PUT/DELETE `/api/products/**`, `/api/variants/**`, `/api/rental-periods/**` | `hasRole("ADMIN")` |
| POST `/api/orders/*/confirm`, `/reject`, `/pickup/**`, `/return/**`, `/damage-report` | `hasRole("ADMIN")` |
| POST `/api/orders/*/payment` | `hasRole("CUSTOMER")` |
| everything else | `authenticated()` |

Note: only two roles exist in this codebase (`ADMIN`, `CUSTOMER`) — the `ROLE1..ROLE4` placeholder
scheme described in [.claude/CLAUDE.md](.claude/CLAUDE.md) was collapsed to this rental-specific
pair as part of building out the system in [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).
