# Landing Page Specification

## Overview
The landing page serves as the primary entry point for the Siraj application, showcasing the platform's capabilities and converting visitors into users.

## Page Structure

### URL
- **Route**: `/` (root)
- **Layout**: `src/app/(marketing)/layout.tsx`
- **Component**: `src/app/(marketing)/page.tsx`

### Sections (In Order)

#### 1. Hero Section
**Component**: `src/components/marketing/Hero.tsx`

**Purpose**: Primary conversion point with clear value proposition

**Content**:
- Badge: "أحدث منصة ذكاء اصطناعي للغة العربية"
- Main heading: "سيراج" + "منصة الذكاء الاصطناعي"
- Subtitle: Value proposition in Arabic
- Feature highlights: Speed, Accuracy, Advanced AI
- CTA buttons: "ابدأ الآن" (primary), "عرض الأسعار" (secondary)
- Stats: 10K+ users, 99.9% uptime, 24/7 support
- Floating visual: Mock interface with animations

**Animations**:
- Gradient blob drift (30s loops)
- Floating card bob animation
- Staggered text animations
- Button hover effects

**Responsive Behavior**:
- Mobile: Stacked layout, centered text
- Desktop: Side-by-side layout, left-aligned text

#### 2. Features Section
**Component**: `src/components/marketing/Features.tsx`

**Purpose**: Showcase platform capabilities

**Content**:
- Section badge: "المميزات الأساسية"
- Heading: "كل ما تحتاجه في منصة واحدة"
- Feature grid (6 items):
  - Advanced AI
  - Smart Content Creation
  - Data Analysis
  - High Speed
  - Security & Protection
  - Multi-language Support
- Additional features (3 items):
  - Text Processing
  - Team Collaboration
  - Advanced Customization

**Animations**:
- Scroll-triggered animations
- Hover effects on cards
- Icon scale animations

#### 3. Pricing Section
**Component**: `src/components/marketing/Pricing.tsx`

**Purpose**: Convert visitors to paid users

**Content**:
- Section badge: "خطط الأسعار"
- Heading: "اختر الخطة المناسبة لك"
- Yearly discount badge: "خصم 20% للاشتراك السنوي"
- Three pricing tiers:
  - Free: $0/month
  - Professional: $29/month (highlighted)
  - Enterprise: $99/month
- Additional info: Support, refund policy, features

**Animations**:
- Card hover effects
- Popular plan highlighting
- Smooth transitions

#### 4. Footer
**Component**: Inline in page component

**Purpose**: Navigation and legal information

**Content**:
- Brand section with social links
- Product links
- Support links
- Copyright and legal links

## Design Tokens

### Colors
- **Primary**: `#7F22FE` (Violet)
- **Accent**: `#00E5FF` (Cyan)
- **Background**: `#0B0B10` (Deep dark)
- **Card**: `#18181b` (Card backgrounds)

### Typography
- **Font**: Cairo (Arabic + Latin)
- **Heading sizes**: 3.5rem to 7rem (responsive)
- **Body text**: 1rem to 1.25rem

### Spacing
- **Section padding**: 6rem (py-24)
- **Container max-width**: 7xl (max-w-7xl)
- **Grid gaps**: 1rem to 3rem

## User Stories

### Primary User Journey
1. **Anonymous User** visits landing page
2. **Sees value proposition** in hero section
3. **Explores features** in features section
4. **Reviews pricing** in pricing section
5. **Clicks CTA** to start free trial or view pricing
6. **Converts** to registered user

### Secondary User Journey
1. **Returning User** visits landing page
2. **Skips to pricing** or specific features
3. **Upgrades** existing plan
4. **Accesses support** or documentation

## Accessibility Requirements

### WCAG AA Compliance
- **Color contrast**: Minimum 4.5:1 for normal text
- **Focus indicators**: Visible focus rings
- **Keyboard navigation**: All interactive elements accessible
- **Screen readers**: Proper ARIA labels and descriptions

### RTL Support
- **Text direction**: Right-to-left for Arabic
- **Layout mirroring**: Icons and layouts adapt
- **Font loading**: Cairo font with Arabic subset

### Reduced Motion
- **Animation respect**: Pause animations when `prefers-reduced-motion: reduce`
- **Alternative states**: Static versions of animated elements

## Performance Requirements

### Core Web Vitals
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### Loading Strategy
- **Critical CSS**: Inline for above-the-fold content
- **Image optimization**: WebP format with fallbacks
- **Font loading**: Preload Cairo font
- **Animation optimization**: CSS transforms and opacity

## SEO Requirements

### Meta Tags
```html
<title>Siraj — Arabic AI SaaS Platform</title>
<meta name="description" content="Advanced AI-powered platform for Arabic content creation, analysis, and automation.">
<meta name="keywords" content="Arabic AI, SaaS, Content Creation, Automation">
```

### Open Graph
- **Title**: "Siraj — Arabic AI SaaS Platform"
- **Description**: Platform description
- **Locale**: ar_AR with en_US alternate
- **Type**: website

### Structured Data
- **Organization**: Company information
- **Product**: Platform details
- **Breadcrumb**: Navigation structure

## Analytics Integration

### Conversion Tracking
- **CTA clicks**: Track "Get Started" and "View Pricing" clicks
- **Scroll depth**: Monitor section engagement
- **Time on page**: Measure engagement duration
- **Bounce rate**: Optimize for lower bounce rates

### Event Tracking
- **Feature exploration**: Track feature card interactions
- **Pricing interaction**: Monitor pricing plan views
- **Social clicks**: Track social media engagement

## Testing Requirements

### Cross-browser Testing
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Device Testing
- **Mobile**: iPhone, Android (various screen sizes)
- **Tablet**: iPad, Android tablets
- **Desktop**: Various resolutions (1920x1080, 2560x1440, etc.)

### Performance Testing
- **Lighthouse**: Target 90+ scores
- **WebPageTest**: Multiple locations
- **Real User Monitoring**: Core Web Vitals tracking

## Content Management

### Localization
- **Arabic**: Primary language
- **English**: Secondary language (future)
- **RTL support**: Full right-to-left layout
- **Cultural adaptation**: Arabic-specific content and imagery

### Content Updates
- **Pricing**: Dynamic pricing display
- **Features**: Easy feature addition/removal
- **Testimonials**: Customer success stories
- **Stats**: Real-time user statistics

## Future Enhancements

### Planned Features
- **Interactive demo**: Embedded product demo
- **Customer testimonials**: Success stories section
- **Blog integration**: Content marketing section
- **Live chat**: Customer support integration
- **A/B testing**: Conversion optimization
- **Personalization**: Dynamic content based on user behavior
