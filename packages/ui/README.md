# @jasaweb/ui

> Shared UI components for JasaWeb applications

A comprehensive React component library with TypeScript support, built with modern design patterns and accessibility in mind.

## 📦 Installation

```bash
# From root of monorepo
pnpm install

# Or install specific package
pnpm add @jasaweb/ui
```

## 🎨 Design System

The UI package includes a comprehensive design token system:

```tsx
import { designTokens, componentVariants } from '@jasaweb/ui';

// Use design tokens
const primaryColor = designTokens.colors.primary[500];
const buttonVariant = componentVariants.button.primary;
```

## 🧩 Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@jasaweb/ui';

function MyComponent() {
  return (
    <div>
      <Button variant="primary" size="md">
        Primary Button
      </Button>

      <Button variant="outline" size="lg" loading>
        Loading Button
      </Button>

      <Button
        variant="success"
        leftIcon={<PlusIcon />}
        rightIcon={<ArrowIcon />}
      >
        Add Item
      </Button>
    </div>
  );
}
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error'`
- `size`: `'sm' | 'md' | 'lg'`
- `loading`: `boolean`
- `fullWidth`: `boolean`
- `leftIcon` / `rightIcon`: `React.ReactNode`

### Card

Flexible card component for content sections.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@jasaweb/ui';

function ProfileCard() {
  return (
    <Card padding="md" shadow="md" rounded="lg">
      <CardHeader>
        <h3>Profile Information</h3>
      </CardHeader>
      <CardBody>
        <p>User profile content goes here...</p>
      </CardBody>
      <CardFooter>
        <Button variant="outline">Edit</Button>
        <Button variant="primary">Save</Button>
      </CardFooter>
    </Card>
  );
}
```

**Props:**
- `padding`: `'none' | 'sm' | 'md' | 'lg'`
- `shadow`: `'none' | 'sm' | 'md' | 'lg'`
- `rounded`: `'none' | 'sm' | 'md' | 'lg' | 'xl'`

### Input

Form input component with label, error states, and icons.

```tsx
import { Input } from '@jasaweb/ui';

function ContactForm() {
  return (
    <div>
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        helperText="We'll never share your email"
        leftIcon={<MailIcon />}
      />

      <Input
        label="Password"
        type="password"
        error="Password must be at least 8 characters"
        rightIcon={<EyeIcon />}
      />
    </div>
  );
}
```

**Props:**
- `label`: `string`
- `helperText`: `string`
- `error`: `string`
- `fullWidth`: `boolean`
- `size`: `'sm' | 'md' | 'lg'`
- `leftIcon` / `rightIcon`: `React.ReactNode`

### Modal/Dialog

Modal component for dialogs and overlays.

```tsx
import { Dialog } from '@jasaweb/ui';

function ConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Dialog
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
      >
        <p>Are you sure you want to delete this item?</p>

        <Dialog
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="error" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  );
}
```

### Form Components

Form utilities for consistent form handling.

```tsx
import { Form, FormField, FormLabel, FormError } from '@jasaweb/ui';

function SignupForm() {
  const [errors, setErrors] = useState({});

  return (
    <Form onSubmit={handleSubmit}>
      <FormField error={errors.email}>
        <FormLabel htmlFor="email" required>
          Email
        </FormLabel>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
        />
        <FormError>{errors.email}</FormError>
      </FormField>

      <FormField>
        <FormLabel htmlFor="password">Password</FormLabel>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
        />
      </FormField>
    </Form>
  );
}
```

## 🪝 Custom Hooks

### useModal

```tsx
import { useModal } from '@jasaweb/ui';

function MyComponent() {
  const { isOpen, open, close, toggle } = useModal();

  return (
    <div>
      <Button onClick={open}>Open Modal</Button>
      <Dialog isOpen={isOpen} onClose={close}>
        Modal content
      </Dialog>
    </div>
  );
}
```

### useForm

```tsx
import { useForm } from '@jasaweb/ui';

function MyForm() {
  const { values, errors, setValue, setError } = useForm({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.email) {
      setError('email', 'Email is required');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={values.email}
        onChange={(e) => setValue('email', e.target.value)}
        error={errors.email}
      />
    </form>
  );
}
```

## 🎯 Utilities

### cn (className utility)

```tsx
import { cn } from '@jasaweb/ui';

function MyComponent({ className, isActive }) {
  return (
    <div className={cn(
      'base-classes',
      isActive && 'active-classes',
      className
    )}>
      Content
    </div>
  );
}
```

## 🚀 Development

### Building

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Lint and format
pnpm lint
pnpm format
```

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 📚 Best Practices

1. **Consistent Styling**: Use the design tokens for colors, spacing, and typography
2. **Accessibility**: All components include proper ARIA attributes and keyboard navigation
3. **TypeScript**: Full TypeScript support with comprehensive prop types
4. **Performance**: Components are optimized for performance with proper React patterns
5. **Responsive**: Components work seamlessly across different screen sizes

## 🎨 Customization

The design system is fully customizable through the design tokens:

```tsx
// Extend or override design tokens
import { designTokens } from '@jasaweb/ui';

const customTokens = {
  ...designTokens,
  colors: {
    ...designTokens.colors,
    brand: {
      500: '#your-brand-color'
    }
  }
};
```

## 📄 License

MIT © [JasaWeb](https://jasaweb.com)