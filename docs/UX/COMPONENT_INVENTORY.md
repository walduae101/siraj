# Component Inventory

## Overview
This document provides a comprehensive inventory of all components in the Siraj application, organized by category and complexity level.

## Component Categories

### Atoms (Basic Building Blocks)
The smallest, most fundamental components that cannot be broken down further.

#### UI Components
- **Button** (`src/components/ui/button.tsx`)
  - Primary, secondary, and ghost variants
  - Loading states and disabled states
  - Icon support and responsive sizing

- **Input** (`src/components/ui/input.tsx`)
  - Text input with validation states
  - Error and success states
  - Placeholder and label support

- **Label** (`src/components/ui/label.tsx`)
  - Accessible form labels
  - Required field indicators

- **Badge** (`src/components/ui/badge.tsx`)
  - Status indicators
  - Count badges and tags

- **Skeleton** (`src/components/ui/skeleton.tsx`)
  - Loading placeholders
  - Various shapes and sizes

#### Visual Elements
- **AnimatedBackground** (`src/components/visuals/AnimatedBackground.tsx`)
  - Gradient blob animations
  - Particle system
  - Grid pattern overlay
  - Reduced motion support

### Molecules (Combined Atoms)
Components that combine multiple atoms to create more complex functionality.

#### Marketing Components
- **Hero** (`src/components/marketing/Hero.tsx`)
  - Landing page hero section
  - Animated elements and CTAs
  - Responsive layout with RTL support

- **Features** (`src/components/marketing/Features.tsx`)
  - Feature showcase grid
  - Icon and description cards
  - Hover animations

- **Pricing** (`src/components/marketing/Pricing.tsx`)
  - Pricing tier cards
  - Popular plan highlighting
  - Yearly discount display

#### App Components
- **MessageBubble** (`src/components/app/MessageBubble.tsx`)
  - Chat message display
  - User vs assistant styling
  - Message actions (copy, regenerate, etc.)
  - Loading state variant

- **Composer** (`src/components/app/Composer.tsx`)
  - Message input with suggestions
  - Auto-resize textarea
  - Send button with loading state
  - Character count and model indicator

### Organisms (Complex Components)
Components that combine multiple molecules to create substantial sections.

#### App Shell Components
- **AppShell** (`src/components/app/AppShell.tsx`)
  - Main application layout
  - Sidebar and topbar integration
  - Responsive behavior

- **Sidebar** (`src/components/app/Sidebar.tsx`)
  - Chat list navigation
  - Search functionality
  - Settings and upgrade links
  - Collapsible behavior

- **Topbar** (`src/components/app/Topbar.tsx`)
  - Model selector dropdown
  - Search, help, and profile buttons
  - Mobile menu toggle

- **ChatList** (`src/components/app/ChatList.tsx`)
  - Chat history display
  - Date grouping (Today, Previous 7 days)
  - Search filtering
  - Chat item actions

### Templates (Page Layouts)
Complete page layouts that combine organisms.

#### Marketing Templates
- **Marketing Layout** (`src/app/(marketing)/layout.tsx`)
  - Marketing page wrapper
  - SEO metadata
  - RTL support and fonts

- **Landing Page** (`src/app/(marketing)/page.tsx`)
  - Complete landing page
  - Hero, features, pricing sections
  - Footer with links

#### App Templates
- **Dashboard Layout** (`src/app/(app)/dashboard/layout.tsx`)
  - App shell wrapper
  - Authentication context

- **Dashboard Page** (`src/app/(app)/dashboard/page.tsx`)
  - Chat interface
  - Message history
  - Empty state with suggestions

## Component Hierarchy

```
Atoms
├── UI Components
│   ├── Button
│   ├── Input
│   ├── Label
│   ├── Badge
│   └── Skeleton
└── Visual Elements
    └── AnimatedBackground

Molecules
├── Marketing
│   ├── Hero
│   ├── Features
│   └── Pricing
└── App
    ├── MessageBubble
    └── Composer

Organisms
└── App Shell
    ├── AppShell
    ├── Sidebar
    ├── Topbar
    └── ChatList

Templates
├── Marketing
│   ├── Marketing Layout
│   └── Landing Page
└── App
    ├── Dashboard Layout
    └── Dashboard Page
```

## Component Properties

### Common Props
- **className**: Custom CSS classes
- **children**: Child components
- **disabled**: Disabled state
- **loading**: Loading state

### Animation Props
- **initial**: Initial animation state
- **animate**: Target animation state
- **transition**: Animation configuration
- **whileHover**: Hover animation
- **whileTap**: Tap animation

### Accessibility Props
- **aria-label**: Screen reader labels
- **aria-describedby**: Descriptions
- **role**: ARIA roles
- **tabIndex**: Keyboard navigation

## Usage Guidelines

### Component Selection
- Use atoms for basic UI elements
- Use molecules for common patterns
- Use organisms for complex sections
- Use templates for page layouts

### Styling
- Use Tailwind CSS classes
- Follow design system tokens
- Maintain RTL support
- Ensure responsive behavior

### Accessibility
- Include proper ARIA attributes
- Ensure keyboard navigation
- Maintain color contrast
- Support screen readers

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Optimize animations
- Lazy load when appropriate

## Storybook Integration

### Story Organization
- Group stories by component category
- Include multiple variants per component
- Add interaction tests
- Document props and usage

### Story Examples
- Default state
- Loading state
- Error state
- Empty state
- Responsive variants
- RTL layout

## Future Components

### Planned Additions
- **Modal/Dialog**: Overlay components
- **Toast**: Notification system
- **Tooltip**: Information overlays
- **Switch**: Toggle components
- **Checkbox**: Form controls
- **Radio**: Selection controls
- **Select**: Dropdown components
- **Tabs**: Tabbed interfaces
- **Accordion**: Collapsible sections
- **Breadcrumb**: Navigation trails

### Enhancement Ideas
- **Virtual Scrolling**: For large lists
- **Drag and Drop**: For reordering
- **File Upload**: With progress
- **Rich Text Editor**: For content creation
- **Data Table**: For data display
- **Charts**: For data visualization
