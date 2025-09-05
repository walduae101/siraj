# 🚀 Enterprise Next.js App Template

A production-ready, enterprise-grade Next.js application template with Firebase backend, comprehensive monitoring, security headers, and multi-region deployment.

## ✨ Features

- **🔄 Next.js 15 + React 19** - Latest framework with App Router
- **🔥 Firebase Integration** - Authentication, Firestore, Cloud Functions
- **🔒 Enterprise Security** - CSP, security headers, authentication flows
- **📊 Comprehensive Monitoring** - Cloud Monitoring, Error Reporting, custom metrics
- **🌍 Multi-Region Deployment** - US + EU with CDN and load balancing
- **💳 Payment Integration Ready** - Webhook architecture with monitoring
- **🎨 Modern UI** - Tailwind CSS, shadcn/ui components, responsive design
- **🔧 Type Safety** - TypeScript, tRPC, Zod validation
- **📱 PWA Ready** - Service worker, offline support, app-like experience

## 🚀 Quick Start

### 1. Generate New App

```bash
# Clone the template
git clone <template-repo-url> my-new-app
cd my-new-app

# Remove template history
rm -rf .git
git init

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy and customize environment files
cp .env.example .env.local
cp .env.server.example .env.server.local

# Update with your values
nano .env.local
nano .env.server.local
```

### 3. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select: Firestore, Hosting, Functions
# Use your project ID
```

### 4. Customize App

```bash
# Update app metadata
nano src/app/layout.tsx
nano package.json
nano next.config.mjs

# Update branding and colors
nano src/styles/globals.css
nano tailwind.config.js
```

### 5. Deploy

```bash
# Build and test locally
pnpm build
pnpm start

# Deploy to Firebase
firebase deploy

# Or use Cloud Build (recommended)
gcloud builds submit
```

## 🏗️ Architecture Overview

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/          # Protected dashboard
│   ├── api/               # API routes (tRPC)
│   └── layout.tsx         # Root layout
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   └── dashboard/          # Dashboard components
├── lib/                    # Utility libraries
├── server/                 # Server-side code
│   └── api/               # tRPC router
├── stores/                 # State management
├── styles/                 # Global styles
└── trpc/                   # tRPC client setup
```

## 🔧 Configuration Points

### App Identity
- `package.json` - App name, description, version
- `src/app/layout.tsx` - Page title, metadata, language
- `src/styles/globals.css` - Color scheme, fonts
- `tailwind.config.js` - Design system colors

### Firebase
- `src/env.js` - Firebase config variables
- `firebase.json` - Project configuration
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Query optimization

### Security & Monitoring
- `next.config.mjs` - Security headers, CSP
- `monitoring/` - Cloud Monitoring dashboards
- `scripts/` - Health checks and monitoring scripts

### Deployment
- `cloudbuild.yaml` - CI/CD pipeline
- `Dockerfile` - Container configuration
- `scripts/deploy-*.sh` - Deployment scripts

## 🎨 Customization Guide

### 1. Branding & Identity

```typescript
// src/app/layout.tsx
export const metadata = { 
  title: "Your App Name", 
  description: "Your app description" 
};

// src/styles/globals.css
:root {
  --primary: #your-primary-color;
  --secondary: #your-secondary-color;
}
```

### 2. Authentication Flow

```typescript
// src/lib/firebase-auth.ts
export const authConfig = {
  signInOptions: [
    // Add your auth providers
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ]
};
```

### 3. Database Schema

```typescript
// src/server/api/routers/your-router.ts
export const yourRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      // Add your fields
    }))
    .mutation(async ({ input }) => {
      // Your business logic
    }),
});
```

### 4. UI Components

```typescript
// src/components/your-component.tsx
export function YourComponent() {
  return (
    <div className="your-custom-styles">
      {/* Your component content */}
    </div>
  );
}
```

## 🔒 Security Features

### Headers & CSP
- **Strict-Transport-Security** - HTTPS enforcement
- **Content-Security-Policy** - XSS protection
- **X-Frame-Options** - Clickjacking protection
- **X-Content-Type-Options** - MIME sniffing protection

### Authentication
- **Firebase Auth** - Secure user management
- **Protected Routes** - Role-based access control
- **Token Validation** - Server-side verification

### Database
- **Firestore Rules** - Least privilege access
- **Input Validation** - Zod schema validation
- **Rate Limiting** - API abuse prevention

## 📊 Monitoring & Observability

### Metrics
- **Custom Metrics** - Business KPIs
- **Performance** - Web Vitals, Core Web Metrics
- **Errors** - Error rates, stack traces
- **Security** - Failed auth attempts, rule violations

### Dashboards
- **Real-time Monitoring** - Live app health
- **Performance Analysis** - Response times, throughput
- **Error Tracking** - Error patterns, impact analysis
- **Security Monitoring** - Threat detection, compliance

### Alerts
- **Performance Degradation** - Response time spikes
- **Error Rate Increases** - Failure pattern detection
- **Security Incidents** - Unusual activity patterns
- **Infrastructure Issues** - Resource constraints

## 🌍 Deployment

### Multi-Region Setup
- **Primary Region** - US Central (us-central1)
- **Secondary Region** - Europe West (europe-west1)
- **CDN** - Global content delivery
- **Load Balancing** - Intelligent traffic routing

### CI/CD Pipeline
- **Automated Testing** - Lint, typecheck, build
- **Security Scanning** - Dependency vulnerabilities
- **Automated Deployment** - Zero-downtime updates
- **Health Checks** - Post-deployment validation

### Environment Management
- **Secret Manager** - Secure configuration
- **Environment Variables** - Runtime configuration
- **Feature Flags** - Gradual rollouts
- **Rollback Strategy** - Quick recovery

## 🧪 Testing

### Unit Tests
```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Integration Tests
```bash
# API tests
pnpm test:api

# E2E tests
pnpm test:e2e

# Performance tests
pnpm test:perf
```

### Health Checks
```bash
# Local health check
pnpm health:check

# Production health check
pnpm health:prod

# Monitoring validation
pnpm monitor:validate
```

## 📚 Documentation

- **API Reference** - tRPC endpoint documentation
- **Component Library** - UI component usage
- **Deployment Guide** - Infrastructure setup
- **Security Guide** - Best practices and compliance
- **Monitoring Guide** - Observability setup
- **Troubleshooting** - Common issues and solutions

## 🤝 Contributing

1. **Fork** the template repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

This template is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation** - Check the docs folder
- **Issues** - Open a GitHub issue
- **Discussions** - Join community discussions
- **Security** - Report security vulnerabilities privately

---

**Built with ❤️ using enterprise best practices**
