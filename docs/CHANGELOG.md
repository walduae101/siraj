# Changelog

All notable changes to this project will be documented in this file.

## [2025-01-10] - PHASE 4: Revenue Assurance, Reconciliation & Production Cutover

### Added
- **Automated Reconciliation**: Daily job to verify wallet correctness with self-healing
- **Backfill Operations**: Webhook replay and reversal creation for missing events
- **CI Security Guardrails**: Gitleaks integration with secret scanning
- **Dual Environment Setup**: TEST/PROD separation with isolated resources
- **Production Cutover**: Zero-downtime deployment with comprehensive checklist
- **Revenue Assurance**: Complete audit trail and drift detection

### Changed
- **Wallet Invariant**: `wallet.points === sum(ledger.amount)` enforced daily
- **Webhook Processing**: Enhanced with backfill capabilities for missing events
- **Security**: Automated secret detection and blocking in CI pipeline
- **Environment Management**: Isolated TEST/PROD with separate Firebase projects

### Technical Details
- **New Collections**: `reconciliationReports/`, `dataMigrations/`
- **New Indexes**: 5 collection-group indexes for ledger and webhook queries
- **New Services**: `ReconciliationService`, `BackfillService`
- **New Endpoints**: `/api/jobs/reconcile`, `/api/jobs/backfill`
- **Feature Flags**: `RECONCILIATION_ENABLED`, `BACKFILL_ENABLED`, `ENVIRONMENT`

### Security
- **Secret Scanning**: Gitleaks integration with blocking rules
- **Pattern Detection**: Custom checks for API keys and service account JSON
- **Environment Isolation**: Separate Secret Manager bundles for TEST/PROD
- **OIDC Authentication**: Secure job endpoint access

### Documentation
- **docs/PHASE_4/README.md**: Complete implementation guide
- **docs/PHASE_4/RECONCILIATION_DESIGN.md**: Detailed reconciliation system design
- **docs/PHASE_4/BACKFILL_RUNBOOK.md**: Operational guide for backfill operations
- **docs/PHASE_4/CIS_GUARDRAILS.md**: CI security controls documentation
- **docs/PHASE_4/CUTOVER_CHECKLIST.md**: Production deployment checklist

---

## [2025-01-10] - PHASE 3: Product SoT + Ledger & Reversals + Admin + Guardrails

### Added
- **Product Source of Truth**: Migrated from GSM to versioned Firestore catalog
- **Immutable Wallet Ledger**: Transactional ledger with reversal support
- **Admin Panel**: Internal management interface at `/admin`
- **Refund/Chargeback Handling**: Automatic reversal processing
- **Feature Flags**: `PRODUCT_SOT` and `ALLOW_NEGATIVE_BALANCE`
- **Enhanced Observability**: Structured logging with new fields

### Changed
- **Webhook Processing**: Now uses Firestore product catalog with GSM fallback
- **Wallet Operations**: Atomic balance + ledger updates
- **Security Rules**: Updated for new collections with admin-only writes
- **Product Management**: Versioned products with metadata

### Technical Details
- **New Collections**: `products/`, `promotions/`, `users/{uid}/ledger/`
- **New Indexes**: 5 composite indexes for optimal performance
- **Migration**: 9 products migrated from GSM to Firestore
- **Tests**: 12/12 automated tests passing (100% success rate)

### Security
- **Admin Access**: Firebase custom claims validation
- **Audit Trail**: Complete history of all wallet operations
- **Immutable Ledger**: No destructive edits, reversal support
- **Feature Flags**: Zero-downtime rollback capability

### Documentation
- **PHASE_3_COMPLETION_REPORT.md**: Comprehensive implementation report
- **docs/PHASE_3/README.md**: Technical documentation and runbooks
- **Migration Scripts**: Automated product migration and testing

---

## [2024-12-XX] - PHASE 2: Webhook Security & Observability

### Added
- **Webhook Security**: HMAC verification, replay protection, idempotency
- **Structured Logging**: Enhanced observability with structured fields
- **Metrics**: PayNow webhook performance and error tracking
- **Monitoring**: Cloud Monitoring dashboards and alert policies

### Changed
- **Webhook Processing**: Fast ACK with async processing
- **Error Handling**: Comprehensive error tracking and reporting
- **Performance**: Optimized webhook response times

### Technical Details
- **Security**: HMAC-SHA256 with base64 encoding
- **Idempotency**: WebhookEvents collection for duplicate prevention
- **Monitoring**: 4 log-based metrics for observability
- **Alerts**: Automated alerting for webhook failures

---

## [2024-XX-XX] - PHASE 1: Initial Implementation

### Added
- **PayNow Integration**: Basic webhook processing
- **Points System**: User wallet and balance management
- **Firebase Integration**: User authentication and data storage
- **Basic UI**: Checkout and success pages

### Technical Details
- **Framework**: Next.js 15 with TypeScript
- **Database**: Firestore with real-time updates
- **Authentication**: Firebase Auth with Google sign-in
- **Payment**: PayNow integration for point purchases
