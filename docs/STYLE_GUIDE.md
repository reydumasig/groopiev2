# Groopie Style Guide

## CSS Architecture

### Layer Organization

1. **Base Layer** (`@layer base`)
   - Theme variables
   - Root styles
   - Typography defaults
   - Dark mode overrides

2. **Components Layer** (`@layer components`)
   - Reusable component styles
   - Custom utilities
   - Layout patterns

3. **Utilities Layer** (`@layer utilities`)
   - Custom utility classes
   - Extensions to Tailwind utilities

### Theme Variables

#### Color System
```css
/* Base Colors */
--background: oklch(1 0 0)
--foreground: oklch(0.145 0 0)

/* UI Elements */
--primary: oklch(0.205 0 0)
--secondary: oklch(0.97 0 0)
--accent: oklch(0.97 0 0)

/* State Colors */
--destructive: oklch(0.577 0.245 27.325)
--muted: oklch(0.97 0 0)

/* Component Colors */
--card: oklch(1 0 0)
--popover: oklch(1 0 0)
--sidebar: oklch(0.985 0 0)
```

#### Typography
```css
/* Font Families */
--font-sans: var(--font-geist-sans)
--font-mono: var(--font-geist-mono)

/* Font Sizes */
text-xs: 0.75rem
text-sm: 0.875rem
text-base: 1rem
text-lg: 1.125rem
text-xl: 1.25rem
```

#### Spacing
```css
/* Border Radius */
--radius: 0.625rem
--radius-sm: calc(var(--radius) - 4px)
--radius-md: calc(var(--radius) - 2px)
--radius-lg: var(--radius)
--radius-xl: calc(var(--radius) + 4px)

/* Spacing Scale */
space-1: 0.25rem
space-2: 0.5rem
space-4: 1rem
space-8: 2rem
```

## Component Patterns

### Button Variants
```tsx
// Primary Button
<Button variant="primary">
  Primary Action
</Button>

// Secondary Button
<Button variant="secondary">
  Secondary Action
</Button>

// Destructive Button
<Button variant="destructive">
  Delete
</Button>
```

### Form Elements
```tsx
// Text Input
<Input
  placeholder="Enter text"
  className="w-full"
/>

// Select
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Layout Components
```tsx
// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Container
<Container>
  <main>Content</main>
</Container>
```

## Best Practices

### CSS Guidelines

1. **Use Tailwind Classes First**
   ```tsx
   // Good
   <div className="flex items-center space-x-4">
   
   // Avoid
   <div className="custom-flex-container">
   ```

2. **Custom CSS When Needed**
   ```css
   /* Only for complex patterns */
   .custom-gradient {
     @apply bg-gradient-to-r from-primary to-secondary;
   }
   ```

3. **Theme Consistency**
   ```tsx
   // Good
   <div className="text-primary bg-background">
   
   // Avoid
   <div className="text-[#123456] bg-[#ffffff]">
   ```

### Component Guidelines

1. **Prop Types**
   ```tsx
   interface ButtonProps {
     variant?: 'primary' | 'secondary' | 'destructive';
     size?: 'sm' | 'md' | 'lg';
     children: React.ReactNode;
   }
   ```

2. **Component Organization**
   ```tsx
   // components/ui/Button/index.tsx
   export * from './Button';
   export * from './ButtonGroup';
   ```

3. **Accessibility**
   ```tsx
   <button
     aria-label="Close dialog"
     role="button"
     tabIndex={0}
   >
   ```

## Dark Mode

### Implementation
```tsx
// Toggle dark mode
<html className={theme === 'dark' ? 'dark' : ''}>

// Dark mode styles
<div className="bg-background dark:bg-slate-900">
```

### Color Patterns
```css
/* Light theme */
--background: oklch(1 0 0)
--foreground: oklch(0.145 0 0)

/* Dark theme */
.dark {
  --background: oklch(0.145 0 0)
  --foreground: oklch(0.985 0 0)
}
```

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1400px /* Extra Large */
```

### Media Query Usage
```tsx
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Container
<div className="container mx-auto px-4">
```

## Animation

### Transitions
```css
/* Default transition */
transition-all duration-200 ease-in-out

/* Smooth hover */
hover:scale-105 transition-transform
```

### Loading States
```tsx
<Button isLoading>
  <LoadingSpinner />
  Processing
</Button>
```

## Icons

### Usage
```tsx
// Import icons
import { Icons } from "@/components/icons"

// Use in components
<Icons.chevronRight className="h-4 w-4" />
```

## Forms

### Validation States
```tsx
<Input
  error={errors.email}
  success={isValid}
  className="focus:ring-2 focus:ring-primary"
/>
```

### Error Messages
```tsx
<FormField>
  <FormLabel>Email</FormLabel>
  <Input />
  {error && (
    <FormMessage>Invalid email address</FormMessage>
  )}
</FormField>
``` 