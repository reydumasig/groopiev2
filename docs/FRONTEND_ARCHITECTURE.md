# Frontend Architecture Documentation

## Overview
This document outlines the frontend architecture for the Groopie platform, focusing on styling, components, and theming.

## Tech Stack
- Next.js 14.1.0
- Tailwind CSS
- TypeScript
- Supabase

## Styling Architecture

### CSS Organization
```css
/* 1. Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. Theme Variables */
@layer base {
  :root { /* Light theme variables */ }
  .dark { /* Dark theme variables */ }
}

/* 3. Global Styles */
@layer base {
  /* Base styles */
}

@layer components {
  /* Component styles */
}
```

### Theme Variables
- Use `oklch` color space for better color reproduction
- Prefix convention:
  - Direct variables: `--primary`, `--secondary`, etc.
  - No color prefix needed (removed `--color-` prefix)
  - Component-specific: `--sidebar-*`, `--card-*`

### Color System
- Base colors: background, foreground
- UI elements: primary, secondary, accent
- State colors: destructive, muted
- Component colors: card, popover, sidebar

### Spacing and Typography
- Base radius: `--radius` (0.625rem)
- Font families:
  - Sans: Geist Sans
  - Mono: Geist Mono

## Component Guidelines

### Component Organization
```typescript
/components
  /ui          // Base UI components
  /layout      // Layout components
  /features    // Feature-specific components
  /providers   // Context providers
```

### Component Patterns
- Use TypeScript for all components
- Implement proper prop types
- Follow atomic design principles
- Use CSS modules for component-specific styles

### State Management
- Use React Context for global state
- Implement hooks for reusable logic
- Follow Supabase real-time patterns

## Build and Development

### Development Workflow
1. Use `npm run dev` for local development
2. Follow ESLint and TypeScript guidelines
3. Ensure proper type checking

### Production Build
```bash
npm run build
npm start
```

## Best Practices

### CSS Guidelines
1. Use Tailwind utilities when possible
2. Avoid custom CSS unless necessary
3. Follow mobile-first approach
4. Maintain consistent variable naming

### Component Guidelines
1. Keep components small and focused
2. Use proper TypeScript types
3. Implement proper error boundaries
4. Follow accessibility guidelines

### Performance Guidelines
1. Use proper image optimization
2. Implement code splitting
3. Follow Next.js best practices
4. Monitor bundle size

## Troubleshooting

### Common Issues
1. CSS conflicts: Check layer organization
2. Theme inconsistencies: Verify variable usage
3. Build errors: Clean and rebuild
4. Type errors: Update TypeScript definitions

### Debug Process
1. Check browser console
2. Verify CSS cascade
3. Validate theme variables
4. Review component hierarchy

## Version Control

### Branch Strategy
- `main`: Production code
- `staging`: Pre-production testing
- `feature/*`: Feature development
- `fix/*`: Bug fixes

### Commit Convention
```
feat: Add new feature
fix: Bug fix
style: CSS/styling changes
refactor: Code refactoring
docs: Documentation updates
```

## Deployment

### Environment Setup
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Build Process
1. Clean build artifacts
2. Install dependencies
3. Run type checks
4. Build production assets

## Monitoring

### Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

### Error Tracking
- Browser console errors
- Runtime exceptions
- API failures
- Build warnings 