# 🚀 Enterprise Next.js App Template - Usage Guide

This guide explains how to use the Enterprise Next.js App Template to create new applications quickly and efficiently.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Template Features](#template-features)
3. [Customization Guide](#customization-guide)
4. [Deployment Options](#deployment-options)
5. [Advanced Configuration](#advanced-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## 🚀 Quick Start

### 1. Generate New App

```bash
# Run the template generator
node scripts/generate-template.js my-awesome-app

# Follow the interactive prompts
# - App description
# - Author name
# - Company name
# - Domain
# - Firebase project ID
# - Output directory
```

### 2. Navigate and Install

```bash
# Go to your new app directory
cd my-awesome-app

# Install dependencies
pnpm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 4. Start Development

```bash
# Run development server
pnpm dev

# Open http://localhost:3000
```

## ✨ Template Features

### 🏗️ Architecture
- **Next.js 15** with App Router
- **React 19** with modern hooks
- **TypeScript** for type safety
- **tRPC** for type-safe APIs
- **Firebase** backend integration
- **Tailwind CSS** for styling

### 🔒 Security
- **CSP headers** for XSS protection
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Firebase Auth** with role-based access
- **Input validation** with Zod schemas
- **Rate limiting** and abuse prevention

### 📊 Monitoring
- **Cloud Monitoring** dashboards
- **Error reporting** and alerting
- **Performance metrics** and Web Vitals
- **Custom business metrics**
- **Health checks** and validation

### 🌍 Deployment
- **Multi-region** deployment (US + EU)
- **CDN integration** with cache invalidation
- **Cloud Build** CI/CD pipeline
- **Container deployment** to Cloud Run
- **Firebase hosting** integration

### 💳 Payments (Optional)
- **Stripe integration** ready
- **PayNow integration** ready
- **Webhook handling** with monitoring
- **Secure payment flows**

### 🤖 AI Features (Optional)
- **OpenAI integration** ready
- **Google AI** integration ready
- **Anthropic Claude** integration ready
- **Custom AI providers** support

## 🎨 Customization Guide

### 1. App Identity

#### Update App Name and Description
```typescript
// src/app/layout.tsx
export const metadata = { 
  title: "Your App Name", 
  description: "Your app description" 
};
```

#### Customize Colors and Theme
```css
/* src/styles/globals.css */
:root {
  --primary: #your-primary-color;
  --secondary: #your-secondary-color;
  --accent: #your-accent-color;
  --background: #your-background-color;
  --foreground: #your-foreground-color;
}
```

#### Update Package Information
```json
// package.json
{
  "name": "your-app-name",
  "description": "Your app description",
  "author": "Your Name",
  "repository": {
    "url": "https://github.com/yourusername/your-app"
  }
}
```

### 2. Firebase Configuration

#### Update Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select your project
# Choose: Firestore, Hosting, Functions
```

#### Configure Environment Variables
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
```

### 3. Authentication Setup

#### Configure Auth Providers
```typescript
// src/lib/firebase-auth.ts
export const authConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    // Add more providers as needed
  ]
};
```

#### Customize Auth UI
```typescript
// src/components/auth/SignInForm.tsx
export function SignInForm() {
  return (
    <div className="your-custom-auth-styles">
      {/* Your custom authentication form */}
    </div>
  );
}
```

### 4. Database Schema

#### Define Your Data Models
```typescript
// src/server/api/routers/your-router.ts
export const yourRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().positive(),
      // Add your fields here
    }))
    .mutation(async ({ input, ctx }) => {
      // Your business logic
      const result = await ctx.db.yourTable.create({
        data: input
      });
      return result;
    }),
});
```

#### Update Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your custom rules
    match /yourCollection/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.email_verified == true;
    }
  }
}
```

### 5. UI Components

#### Customize Components
```typescript
// src/components/ui/Button.tsx
export function Button({ children, ...props }) {
  return (
    <button 
      className="your-custom-button-styles"
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Add New Components
```typescript
// src/components/YourComponent.tsx
export function YourComponent() {
  return (
    <div className="your-component-styles">
      {/* Your component content */}
    </div>
  );
}
```

## 🚀 Deployment Options

### 1. Firebase Hosting (Recommended for Startups)

```bash
# Build your app
pnpm build

# Deploy to Firebase
pnpm deploy:dev
```

**Pros:**
- Free tier available
- Easy setup
- Good for MVPs and small apps

**Cons:**
- Limited scalability
- No multi-region by default

### 2. Google Cloud Run (Recommended for Production)

```bash
# Deploy using Cloud Build
pnpm deploy:cloud

# Or manually
gcloud run deploy your-app --source .
```

**Pros:**
- Auto-scaling
- Multi-region deployment
- Enterprise features
- Cost-effective

**Cons:**
- More complex setup
- Requires Google Cloud account

### 3. Vercel (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Pros:**
- Excellent Next.js integration
- Easy deployment
- Good performance

**Cons:**
- Vendor lock-in
- Limited backend features

## ⚙️ Advanced Configuration

### 1. Multi-Region Deployment

```yaml
# cloudbuild.yaml
# Update the regions as needed
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:latest'
  args:
    - gcloud
    - run
    - deploy
    - your-app
    - --region
    - us-central1  # Primary region

- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:latest'
  args:
    - gcloud
    - run
    - deploy
    - your-app-eu
    - --region
    - europe-west1  # Secondary region
```

### 2. Custom Domain Setup

```bash
# Add custom domain to Firebase
firebase hosting:channel:deploy preview
firebase hosting:sites:add your-domain.com

# Or for Cloud Run
gcloud run domain-mappings create \
  --service your-app \
  --domain your-domain.com \
  --region us-central1
```

### 3. CDN Configuration

```yaml
# cloudbuild.yaml
# Update CDN map name
if gcloud compute url-maps list --filter="name:your-cdn-map" --format="value(name)" | grep -q .; then
  gcloud compute url-maps invalidate-cdn-cache your-cdn-map --path '/*' --quiet
fi
```

### 4. Monitoring and Alerting

```json
// monitoring/alert-policies.json
{
  "displayName": "Your App - High Error Rate",
  "conditions": [
    {
      "displayName": "Error rate > 5%",
      "conditionThreshold": {
        "filter": "metric.type=\"custom.googleapis.com/your-app/error-rate\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.05
      }
    }
  ],
  "alertStrategy": {
    "autoClose": "604800s"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm build
```

#### 2. Environment Variables
```bash
# Check environment validation
pnpm typecheck

# Verify .env.local exists
ls -la .env.local
```

#### 3. Firebase Issues
```bash
# Check Firebase project
firebase projects:list

# Verify authentication
firebase login:ci

# Check rules syntax
firebase deploy --only firestore:rules
```

#### 4. Deployment Issues
```bash
# Check Cloud Build logs
gcloud builds log [BUILD_ID]

# Verify service status
gcloud run services describe your-app --region us-central1
```

### Debug Commands

```bash
# Health check
pnpm health:check

# Validate monitoring
pnpm monitor:validate

# Check configuration
pnpm typecheck
pnpm lint
```

## 📚 Best Practices

### 1. Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Develop and test locally
pnpm dev
pnpm test

# 3. Commit with conventional commits
git commit -m "feat: add new feature"

# 4. Push and create PR
git push origin feature/your-feature
```

### 2. Environment Management

```bash
# Development
.env.local          # Local development
.env.development    # Development environment

# Production
.env.production     # Production environment
.env.staging        # Staging environment
```

### 3. Security Checklist

- [ ] Environment variables in Secret Manager
- [ ] Firebase rules configured
- [ ] CSP headers enabled
- [ ] Authentication flows tested
- [ ] Input validation implemented
- [ ] Rate limiting configured

### 4. Performance Optimization

- [ ] Image optimization enabled
- [ ] Bundle analysis configured
- [ ] Lazy loading implemented
- [ ] CDN caching configured
- [ ] Core Web Vitals monitored

### 5. Monitoring Setup

- [ ] Error reporting configured
- [ ] Performance metrics enabled
- [ ] Custom business metrics
- [ ] Alert policies configured
- [ ] Dashboard created

## 📖 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Firebase Community](https://firebase.community)
- [tRPC Discord](https://discord.gg/trpc)

### Support
- Create an issue in the template repository
- Check the troubleshooting section
- Review the example implementations
- Consult the community resources

---

**Happy coding! 🎉**

This template provides you with a solid foundation for building enterprise-grade applications. Follow the best practices, customize according to your needs, and don't hesitate to ask for help in the community.
