# Dashboard QA & Reliability Guide

This document outlines the testing strategy, reliability measures, and quality assurance processes for the Siraj dashboard.

## 🧪 Testing Strategy

### Unit Tests (React Testing Library)

Located in `src/components/dashboard/__tests__/`:

- **ProgressBar.test.tsx**: Tests ARIA compliance, animations, and edge cases
- **UsageSnapshot.test.tsx**: Tests Arabic numerals, nudge logic, and error states
- **QuickActions.test.tsx**: Tests toast interactions, export functionality, and navigation

#### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test ProgressBar.test.tsx
```

### E2E Tests (Playwright)

Located in `tests/dashboard-smoke.spec.ts`:

- **Responsive behavior**: Mobile/desktop layouts
- **RTL support**: Arabic text direction and numerals
- **Accessibility**: ARIA attributes and keyboard navigation
- **Performance**: Load times and metrics
- **Error handling**: Network failures and error boundaries

#### Running E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run all e2e tests
npx playwright test

# Run specific test
npx playwright test dashboard-smoke.spec.ts

# Run with UI mode
npx playwright test --ui

# Run on specific browser
npx playwright test --project=chromium
```

## 🛡️ Error Boundaries

### Implementation

The dashboard uses `ErrorBoundary` components to prevent UI crashes:

```tsx
<ErrorBoundary>
  <UsageSnapshot />
</ErrorBoundary>
```

### Error Boundary Features

- **Graceful fallback**: Shows user-friendly error message in Arabic
- **Retry functionality**: "حاول مرة أخرى" button to retry failed operations
- **Development details**: Shows error stack trace in dev mode
- **Analytics tracking**: Logs errors for monitoring

### Error States Tested

- Network failures
- Component rendering errors
- API timeout scenarios
- Invalid data responses

## 🔧 Edge Cases & Mock Mode

### Development Mock Mode

Enable mock mode for testing edge cases:

```bash
# Set environment variable
export DASHBOARD_MOCK=1

# Or in .env.local
DASHBOARD_MOCK=1
```

### Mock Mode Features

- **Slow API simulation**: 1.5s delay instead of 1s
- **Random failures**: 10% chance of network errors
- **Extended timeouts**: Tests loading states and skeletons
- **Error recovery**: Tests retry mechanisms

### Edge Cases Covered

- Empty data states
- High latency scenarios
- Network timeouts
- Invalid responses
- Component unmounting during async operations

## 📊 Telemetry & Analytics

### UX Metrics Tracked

#### Performance Metrics
- `ux.time_to_usage`: Time to render usage data
- `ux.dashboard_load`: Overall dashboard load time
- `ux.component_render`: Individual component render times

#### Interaction Metrics
- `ux.toast_shown`: Toast notifications displayed
- `usage.nudge_shown`: Usage limit nudges shown
- `ux.error_boundary`: Error boundary activations

### Telemetry Implementation

```typescript
// Performance timing
const startTime = performance.now();
performance.mark('usage-fetch-start');

// ... async operation ...

const endTime = performance.now();
track('ux.time_to_usage', {
  duration: Math.round(endTime - startTime),
  success: true,
});
```

### Privacy Compliance

- **No PII**: Only technical metrics, no user data
- **Server-side proxy**: Analytics sent via `/api/analytics/track`
- **Consent respect**: Honors Do Not Track and user preferences
- **Data minimization**: Only essential UX metrics collected

## 🎯 Quality Gates

### Pre-commit Checks

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Unit tests
npm test

# Build verification
npm run build
```

### CI/CD Pipeline

```yaml
# .github/workflows/dashboard-qa.yml
- name: Run Unit Tests
  run: npm test -- --coverage

- name: Run E2E Tests
  run: npx playwright test

- name: Performance Budget
  run: npm run lighthouse
```

### Performance Budgets

- **Dashboard load**: < 3 seconds
- **Usage render**: < 1 second
- **Bundle size**: < 500KB gzipped
- **Lighthouse score**: > 90

## 🚨 Monitoring & Alerts

### Error Monitoring

- **Error boundaries**: Track component crashes
- **Network failures**: Monitor API reliability
- **Performance regressions**: Alert on slow loads

### Key Metrics

- **Error rate**: < 1% of sessions
- **Load time P95**: < 5 seconds
- **User satisfaction**: > 4.5/5

## 🔍 Debugging Guide

### Common Issues

#### Dashboard Not Loading
1. Check browser console for errors
2. Verify network connectivity
3. Check CSP violations
4. Validate authentication state

#### Performance Issues
1. Check Network tab for slow requests
2. Profile with React DevTools
3. Verify bundle size
4. Check for memory leaks

#### RTL Layout Problems
1. Verify `dir="rtl"` on container
2. Check Arabic numeral conversion
3. Validate icon directions
4. Test with different screen sizes

### Debug Commands

```bash
# Enable debug mode
DEBUG=* npm run dev

# Check bundle analysis
npm run analyze

# Run accessibility audit
npx playwright test --grep="accessibility"

# Performance profiling
npm run lighthouse -- --view
```

## 📋 Testing Checklist

### Manual Testing

- [ ] Dashboard loads on first visit
- [ ] RTL layout displays correctly
- [ ] Arabic numerals show properly
- [ ] Mobile responsive behavior
- [ ] Error states display correctly
- [ ] Toast notifications work
- [ ] Quick actions function properly
- [ ] Usage nudges appear when appropriate
- [ ] Error boundaries catch failures
- [ ] Performance meets budget

### Automated Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Accessibility tests pass
- [ ] Performance tests pass
- [ ] Cross-browser compatibility
- [ ] Mobile device testing

## 🚀 Deployment

### Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke

# Performance check
npm run lighthouse:staging
```

### Production Deployment

```bash
# Deploy to production
npm run deploy:production

# Monitor error rates
npm run monitor:errors

# Check performance metrics
npm run monitor:performance
```

## 📚 Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)
- [Performance Testing](https://web.dev/performance-testing/)
- [RTL Testing Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Writing_Modes)

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Review Cycle**: Monthly
