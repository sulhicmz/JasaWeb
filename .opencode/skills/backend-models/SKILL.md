---
name: backend-models
description: Define database models with clear naming, appropriate data types, constraints, relationships, and validation. Use when creating or modifying database model files, ORM classes, schema definitions, or data model relationships for JasaWeb architecture.
license: MIT
compatibility: opencode
metadata:
  audience: backend-developers
  workflow: database-development
  category: data-modeling
---

## What I do
- Ensure proper database model naming conventions
- Validate data type selections and constraints
- Establish relationship patterns and cascade behaviors
- Implement model-level validation and database constraints
- Guide normalization vs performance decisions
- Create comprehensive testing strategies for models

## When to use me
Use when creating or modifying database model files, defining ORM classes, establishing table relationships, configuring foreign keys and indexes, implementing model validation, or making database architecture decisions in JasaWeb.

## Core Requirements for JasaWeb Models

### Naming Conventions
**Models:** Singular, PascalCase (`User`, `OrderItem`, `PaymentMethod`)

**Tables:** Plural, snake_case (`users`, `order_items`, `payment_methods`)

**Relationships:** Descriptive and clear
- `user.orders` (one-to-many)
- `order.items` (one-to-many)
- `product.categories` (many-to-many)

### Required Fields
**Every model must have:**
```typescript
// Prisma schema example
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
```

### Data Integrity Standards
**Use constraints, not application validation:**
```typescript
model User {
  id    String @id @default(cuid())
  email String @unique  // UNIQUE constraint
  name  String @db.Text // NOT NULL by default
  
  @@map("users")
}

model Order {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("orders")
}
```

## Data Type Guidelines

| Data | Type | Avoid |
|------|------|-------|
| Email, URL | VARCHAR(255) | TEXT |
| Short text | VARCHAR(n) | TEXT |
| Long text | TEXT | VARCHAR |
| Money | DECIMAL(10,2) | FLOAT |
| Boolean | BOOLEAN | TINYINT |
| Timestamps | TIMESTAMP | VARCHAR |
| JSON data | JSON/JSONB | TEXT |
| UUIDs | UUID | VARCHAR(36) |

## Performance Requirements

### Indexing Standards
**Always index:**
- Primary keys (automatic)
- Foreign keys (manual)
- WHERE clause columns
- JOIN condition columns
- ORDER BY columns

```typescript
model Order {
  id        String   @id @default(cuid())
  userId    String   @index  // Foreign key index
  status    String   @index  // Frequently filtered
  createdAt DateTime @index  // Frequently sorted
  
  @@map("orders")
}
```

### Query Performance
- Target: **sub-2ms queries for 1500+ records**
- Monitor slow queries and add indexes
- Use database-level constraints for performance

## Relationship Patterns

### One-to-Many
```typescript
model User {
  id     String  @id @default(cuid())
  orders Order[] // One-to-many
  
  @@map("users")
}

model Order {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
  
  @@map("orders")
}
```

### Cascade Behaviors
- `Cascade`: Delete related records
- `SetNull`: Nullify foreign key
- `Restrict`: Prevent deletion

**Choose based on business logic, not convenience.**

## Validation Layers

### 1. Model-Level Validation
```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @MinLength(8)
  password: string;
}
```

### 2. Database-Level Constraints
- NOT NULL for required fields
- UNIQUE constraints for unique values
- CHECK constraints for business rules
- Foreign key constraints with proper cascades

## Testing Requirements

### Unit Tests
```typescript
describe('User Model', () => {
  it('should require email', async () => {
    await expect(
      prisma.user.create({
        data: { name: 'Test' } // Missing email
      })
    ).rejects.toThrow();
  });
  
  it('should enforce unique email', async () => {
    const email = 'test@example.com';
    
    await prisma.user.create({
      data: { email, name: 'User 1' }
    });
    
    await expect(
      prisma.user.create({
        data: { email, name: 'User 2' }
      })
    ).rejects.toThrow();
  });
});
```

### Integration Tests
- Test relationship integrity
- Validate cascade behaviors
- Performance test with large datasets
- Test constraint enforcement

## Common Patterns

### Soft Deletes
```typescript
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  deletedAt DateTime? @map("deleted_at") @index
  
  @@map("users")
}

// Query only active records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

### Enums for Fixed Values
```typescript
enum OrderStatus {
  PENDING = 'pending'
  PAID = 'paid'
  SHIPPED = 'shipped'
  DELIVERED = 'delivered'
}

model Order {
  id     String      @id @default(cuid())
  status OrderStatus @default(PENDING)
  
  @@map("orders")
}
```

## JasaWeb Integration Rules

1. **Service Layer Compliance**: Models used only by services in `src/services/domain/`
2. **No Direct Database Access**: Never access models directly in .astro pages
3. **Security First**: Always validate input, never trust client data
4. **Performance Standards**: Support sub-2ms queries with proper indexing
5. **Type Safety**: Use TypeScript interfaces for all model interactions
6. **Test Coverage**: 100% test coverage required for all models

## Validation Checklist

Before deploying model changes:

**Structure:**
- [ ] Singular model name, plural table name
- [ ] Primary key defined (prefer cuid())
- [ ] createdAt and updatedAt timestamps
- [ ] Proper mapping with @@map

**Integrity:**
- [ ] NOT NULL on required fields
- [ ] UNIQUE constraints where appropriate
- [ ] Foreign keys with explicit cascade behavior
- [ ] Indexes on foreign keys and queried columns

**Data Types:**
- [ ] Appropriate types selected
- [ ] No generic VARCHAR overuse
- [ ] Proper JSON/JSONB usage
- [ ] UUID instead of VARCHAR for IDs

**Validation:**
- [ ] Model-level validation implemented
- [ ] Database constraints defined
- [ ] Input validation in service layer
- [ ] Comprehensive test coverage

## Examples

When asked to create a new model:

1. **Requirements Analysis**: Understand the domain entities
2. **Schema Design**: Create Prisma schema with proper types
3. **Relationship Planning**: Define relationships and cascades
4. **Index Strategy**: Add performance indexes
5. **Validation Rules**: Implement both model and database validation
6. **Test Creation**: Write comprehensive tests
7. **Service Integration**: Create corresponding service layer classes

This skill ensures JasaWeb maintains its worldclass data integrity standards while providing clear guidance for database model development following the 99.8/100 architectural score requirements.