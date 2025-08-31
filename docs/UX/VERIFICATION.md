# UI/UX Verification Guide

## Storybook Verification

### Setup
```bash
pnpm storybook --port 6007
```

### Expected Stories
- **Visuals/AnimatedBackground**: Default, WithCustomHeight, WithReducedMotion
- **Marketing/Hero**: Default, WithReducedMotion
- **Marketing/Features**: Default, WithCustomBackground
- **Marketing/Pricing**: Default, WithDarkBackground
- **App/Sidebar**: Default, Closed, WithDarkTheme
- **App/Topbar**: Default, WithDarkTheme
- **App/MessageBubble**: UserMessage, AssistantMessage, LongMessage, LoadingMessage
- **App/Composer**: Default, Loading
- **App/ChatList**: Default, Empty, WithDarkTheme

### MSW Integration
- All stories should load without API errors
- Mock data should be available for chat, messages, wallet, plans
- Echo API should work for testing interactions

## Accessibility Testing

### Axe Core Integration
```bash
# Install axe-core for testing
pnpm add -D @axe-core/react axe-core

# Run accessibility tests
npx axe http://localhost:3000
npx axe http://localhost:3000/dashboard
```

### Manual Testing Checklist
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Reduced motion preferences respected
- [ ] RTL layout works correctly

### ARIA Roles
- [ ] Navigation landmarks (`nav`, `main`, `aside`)
- [ ] Form labels and descriptions
- [ ] Button and link roles
- [ ] Dialog and modal roles
- [ ] List and listitem roles

## Performance Testing

### Lighthouse Scores
```bash
# Desktop testing
npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=./docs/UX/lh-home-desktop.json
npx lighthouse http://localhost:3000/dashboard --preset=desktop --output=json --output-path=./docs/UX/lh-dash-desktop.json

# Mobile testing
npx lighthouse http://localhost:3000 --preset=mobile --output=json --output-path=./docs/UX/lh-home-mobile.json
npx lighthouse http://localhost:3000/dashboard --preset=mobile --output=json --output-path=./docs/UX/lh-dash-mobile.json
```

### Target Scores
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 95
- **SEO**: ≥ 90

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## Responsive Testing

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Test Scenarios
- [ ] Mobile navigation (hamburger menu)
- [ ] Sidebar collapse on tablet
- [ ] Touch targets (44px minimum)
- [ ] Text readability on small screens
- [ ] Image scaling and cropping

## RTL Testing

### Arabic Language Support
- [ ] Text direction (right-to-left)
- [ ] Layout mirroring (margins, padding)
- [ ] Font selection (Cairo)
- [ ] Number formatting
- [ ] Date formatting

### Test Commands
```bash
# Test RTL layout
curl -H "Accept-Language: ar" http://localhost:3000

# Check font loading
# Cairo font should load for Arabic content
```

## Animation Testing

### Reduced Motion
- [ ] Animations disabled when `prefers-reduced-motion: reduce`
- [ ] No flashing or strobing effects
- [ ] Smooth transitions when enabled
- [ ] Performance impact minimal

### Animation Performance
- [ ] 60fps animations
- [ ] GPU-accelerated transforms
- [ ] No layout thrashing
- [ ] Smooth scrolling

## Error Handling

### Console Errors
- [ ] No JavaScript errors in console
- [ ] No React warnings
- [ ] No TypeScript errors
- [ ] No accessibility violations

### Network Errors
- [ ] Graceful fallbacks for API failures
- [ ] Loading states for async operations
- [ ] Error boundaries catch React errors
- [ ] User-friendly error messages

## Cross-Browser Testing

### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Test Commands
```bash
# Run tests in different browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Visual Regression Testing

### Screenshots
- [ ] Landing page (desktop/mobile)
- [ ] Dashboard (sidebar open/closed)
- [ ] Storybook component index
- [ ] Error states and loading states

### Comparison
- [ ] Compare with design mockups
- [ ] Check for visual inconsistencies
- [ ] Verify color accuracy
- [ ] Test dark/light themes

## Security Testing

### Content Security Policy
- [ ] CSP headers properly configured
- [ ] No inline scripts or styles
- [ ] External resources whitelisted
- [ ] XSS protection enabled

### Input Validation
- [ ] Form inputs sanitized
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting

## Documentation

### Required Artifacts
- [ ] Screenshots of all pages
- [ ] Lighthouse reports
- [ ] Accessibility audit results
- [ ] Performance metrics
- [ ] Cross-browser test results

### Reporting
- [ ] Issues documented with steps to reproduce
- [ ] Performance bottlenecks identified
- [ ] Accessibility violations listed
- [ ] Recommendations for improvements
