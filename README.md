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

## Contributing
Contributions are welcome! If you'd like to improve Siraj or suggest new features, please fork the repository, make your changes, and submit a pull request.