# Siraj — Arabic AI SaaS

Siraj is a modern Arabic AI SaaS platform built with Next.js 15 and React 19, designed for smart tools and a seamless user experience.

## Features
- 🛒 Complete e-commerce and AI tools dashboard
- 🎨 Fully customizable theming system
- 🔒 Secure authentication with Google
- 📱 Mobile responsive design
- 🚀 Ready for production deployment
- ✨ A marvellous user experience

## Prerequisites
- Node.js 20+
- pnpm

## Setup
This project uses [pnpm](https://pnpm.io/)

```bash
pnpm install
```

### Environment
Create your .env file with the following command

```bash
cp .env.example .env
```

Then make sure to fill in your environment variables.

### Running the Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Theming
The website's color scheme is fully configurable by editing the CSS file located at `/src/styles/globals.css`

## CDN & Security

Siraj is deployed with enterprise-grade CDN and security headers for optimal performance and protection.

### Quick Verification Commands

**HTML (expect no-store + security headers):**
```bash
curl -sSI https://siraj.life | egrep -i '^(HTTP|cache-control|content-type|vary|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy)'
```

**API (expect JSON + no-store):**
```bash
curl -sSI https://siraj.life/api/health | egrep -i '^(HTTP|cache-control|content-type)'
```

**Real chunk (expect immutable, no security headers):**
```bash
ASSET=$(curl -s https://siraj.life | grep -oE '/_next/static/(chunks|app)/[^"]+\.js' | head -1)
curl -sSI "https://siraj.life$ASSET" | egrep -i '^(HTTP|cache-control|content-type|age|etag)'
```

### Security Features
- **Immutable static assets** with optimal caching
- **HTML/API security headers** through CDN
- **Multi-region parity** with automated enforcement
- **CSP Report-Only** monitoring (enforcement planned for Sep 6, 2025)
- **Daily automated checks** via GitHub Actions

### Documentation
- [**Golden Headers Contract**](./GOLDEN_HEADERS_CONTRACT.md) - Exact header requirements
- [**CDN Configuration**](./CDN_CONFIGURATION.md) - CDN settings and behavior
- [**Operational Runbook**](./OPERATIONAL_RUNBOOK.md) - Troubleshooting and monitoring

## Payments & Webhooks

Siraj integrates with PayNow for secure payment processing with enterprise-grade monitoring and reliability. The webhook system includes comprehensive observability, security hardening, and queue-based architecture for high performance.

**Key Features**:
- Production-ready webhook processing with <250ms response times
- 6-layer monitoring with real-time alerts and email notifications
- Security hardening with HMAC verification and replay protection
- Queue architecture ready for <50ms responses and automatic retry logic

**Documentation**:
- [**Phase 1 Setup**](./docs/PHASE_1/RUNBOOK.md) - Complete monitoring and security setup
- [**Monitoring Guide**](./docs/PHASE_1/MONITORING_SETUP.md) - Metrics, dashboard, and alerts
- [**Test Scenarios**](./docs/PHASE_1/TEST_SCENARIOS.md) - Validation procedures
- [**Security Contract**](./docs/SECURITY/WALLET_CONTRACT.md) - Wallet security boundaries
- [**Operations Runbook**](./docs/RUNBOOKS/WEBHOOK_RUNBOOK.md) - Incident response procedures
- [**Phase 2 Queue Architecture**](./docs/PHASE_2/IMPLEMENTATION_GUIDE.md) - High-performance async processing

## Deployment
This project can be deployed on various platforms. For detailed deployment instructions, see the [T3 Stack Deployment Guide](https://create.t3.gg/en/deployment).

## Branching Policy

This repository follows a strict branching policy to maintain code quality and streamline development:

### Branch Structure
- **`main`** - The only long-lived branch, contains production-ready code
- **Feature branches** - Short-lived branches for development work (e.g., `sprint1/feature-name`, `hotfix/critical-fix`)

### Development Workflow
1. **Create feature branch** from `main`: `git checkout -b sprint1/feature-name`
2. **Develop and test** your changes locally
3. **Push branch** and create a pull request
4. **Code review** - At least one approval required
5. **Merge via squash** - Maintains linear history
6. **Auto-deletion** - Feature branches are automatically deleted after merge

### Branch Protection Rules
- ✅ Require pull request reviews (minimum 1 approval)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Require linear history (enforces squash merges)
- ✅ Restrict direct pushes to `main`
- ✅ Block force pushes and deletions
- ✅ Auto-delete head branches after merge

### Naming Conventions
- `sprint*/` - Sprint-related features
- `hotfix/` - Critical production fixes
- `feature/` - General features
- `bugfix/` - Bug fixes

## Contributing
Contributions are welcome! If you'd like to improve Siraj or suggest new features, please fork the repository, make your changes, and submit a pull request.