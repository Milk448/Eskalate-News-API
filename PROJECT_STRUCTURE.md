# News API - Project Structure

## 📁 Clean Senior-Level Backend Structure

```
news-api/
│
├── 📂 prisma/                      # Database Layer
│   ├── migrations/                 # Version-controlled schema changes
│   ├── schema.prisma              # Database schema definition
│   └── seed.ts                    # Sample data seeding
│
├── 📂 src/                         # Source Code
│   │
│   ├── 📂 config/                  # Configuration Layer
│   │   ├── database.ts            # Prisma client + soft delete middleware
│   │   ├── env.ts                 # Environment variable validation
│   │   ├── logger.ts              # Winston logger setup
│   │   ├── queue.ts               # BullMQ queue configuration
│   │   └── redis.ts               # Redis client setup
│   │
│   ├── 📂 controllers/             # Controller Layer (HTTP Handlers)
│   │   ├── article.controller.ts  # Article CRUD operations
│   │   ├── auth.controller.ts     # Authentication endpoints
│   │   └── dashboard.controller.ts # Analytics dashboard
│   │
│   ├── 📂 services/                # Service Layer (Business Logic)
│   │   ├── analytics.service.ts   # Analytics aggregation logic
│   │   ├── article.service.ts     # Article business logic
│   │   ├── auth.service.ts        # Authentication logic
│   │   └── readLog.service.ts     # Read tracking logic
│   │
│   ├── 📂 repositories/            # Repository Layer (Data Access)
│   │   └── article.repository.ts  # Article database queries
│   │
│   ├── 📂 middleware/              # Express Middleware
│   │   ├── auth.ts                # JWT authentication
│   │   ├── errorHandler.ts        # Global error handler
│   │   ├── rbac.ts                # Role-based access control
│   │   └── __tests__/             # Middleware tests
│   │       └── errorHandler.test.ts
│   │
│   ├── 📂 routes/                  # API Routes
│   │   ├── article.routes.ts      # Article endpoints
│   │   ├── auth.routes.ts         # Auth endpoints
│   │   └── dashboard.routes.ts    # Dashboard endpoints
│   │
│   ├── 📂 validators/              # Zod Validation Schemas
│   │   ├── article.validator.ts   # Article validation
│   │   └── auth.validator.ts      # Auth validation
│   │
│   ├── 📂 workers/                 # Background Job Workers
│   │   ├── analytics.worker.ts    # Analytics aggregation worker
│   │   └── readLog.worker.ts      # Read tracking worker
│   │
│   ├── 📂 jobs/                    # Cron Jobs
│   │   └── analytics.cron.ts      # Daily analytics scheduler
│   │
│   ├── 📂 types/                   # TypeScript Types
│   │   └── index.ts               # Shared type definitions
│   │
│   ├── 📂 utils/                   # Utility Functions
│   │   └── response.ts            # Response formatters
│   │
│   ├── 📂 __tests__/               # Test Files
│   │   ├── unit/                  # Unit tests
│   │   │   └── auth.test.ts
│   │   ├── properties/            # Property-based tests
│   │   │   ├── auth.properties.test.ts
│   │   │   └── response.properties.test.ts
│   │   └── helpers/               # Test utilities
│   │
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entry point
│
├── 📂 logs/                        # Application Logs
│   ├── combined.log               # All logs
│   └── error.log                  # Error logs only
│
├── 📄 .env.example                 # Environment variables template
├── 📄 .eslintrc.json              # ESLint configuration
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .prettierrc                 # Code formatting rules
├── 📄 jest.config.js              # Jest testing configuration
├── 📄 package.json                # Dependencies & scripts
├── 📄 tsconfig.json               # TypeScript configuration
└── 📄 README.md                   # Project documentation
```

## 🏗️ Architecture Layers

### 1. **Configuration Layer** (`src/config/`)
- Centralized configuration management
- Database connections
- External service setup (Redis, Queue)
- Environment validation
- Logging configuration

### 2. **Controller Layer** (`src/controllers/`)
- HTTP request/response handling
- Input validation (Zod schemas)
- Delegates to service layer
- Returns standardized responses

### 3. **Service Layer** (`src/services/`)
- Business logic implementation
- Orchestrates multiple repositories
- Transaction management
- Error handling

### 4. **Repository Layer** (`src/repositories/`)
- Database query abstraction
- Prisma ORM operations
- Query building and optimization
- Data access patterns

### 5. **Middleware Layer** (`src/middleware/`)
- Authentication (JWT)
- Authorization (RBAC)
- Error handling
- Request logging

### 6. **Routes Layer** (`src/routes/`)
- API endpoint definitions
- Route-level middleware
- HTTP method mapping

### 7. **Validation Layer** (`src/validators/`)
- Zod schema definitions
- Runtime type validation
- Type inference for TypeScript

### 8. **Background Processing** (`src/workers/`, `src/jobs/`)
- Async job processing
- Scheduled tasks
- Event handling

## 🔄 Request Flow

```
HTTP Request
    ↓
Routes (src/routes/)
    ↓
Middleware (auth, rbac)
    ↓
Controller (src/controllers/)
    ↓
Validation (src/validators/)
    ↓
Service (src/services/)
    ↓
Repository (src/repositories/)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response (src/utils/response.ts)
    ↓
HTTP Response
```

## 🎯 Design Principles

### 1. **Separation of Concerns**
Each layer has a single responsibility:
- Controllers handle HTTP
- Services handle business logic
- Repositories handle data access

### 2. **Dependency Injection**
Services and repositories are instantiated as singletons and exported:
```typescript
export class AuthService { /* ... */ }
export default new AuthService();
```

### 3. **Type Safety**
- TypeScript strict mode
- Zod runtime validation
- Prisma type generation

### 4. **Error Handling**
- Global error handler
- Custom error classes
- Consistent error responses

### 5. **Testability**
- Layered architecture enables mocking
- Dependency injection
- Separate test directory

## ✅ Zod Validation Usage

### Authentication Validation
```typescript
// src/validators/auth.validator.ts
export const registerSchema = z.object({
  name: z.string().regex(/^[A-Za-z\s]+$/),
  email: z.string().email(),
  password: z.string().min(8).regex(passwordRegex),
  role: z.nativeEnum(Role),
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;
```

### Article Validation
```typescript
// src/validators/article.validator.ts
export const createArticleSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(50),
  category: z.string().min(1),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.Draft),
});
```

### Usage in Controllers
```typescript
// src/controllers/auth.controller.ts
register = asyncHandler(async (req: Request, res: Response) => {
  // Zod validates and infers type
  const validatedData = registerSchema.parse(req.body);
  
  const user = await authService.register(validatedData);
  return sendSuccess(res, 'User registered successfully', user, 201);
});
```

## 🔐 Security Features

### 1. **Authentication**
- JWT tokens with bcrypt password hashing
- Token expiration (24 hours)
- Secure secret management

### 2. **Authorization**
- Role-based access control (RBAC)
- Route-level protection
- Ownership verification

### 3. **Input Validation**
- Zod schemas for all inputs
- Strong password policy
- Email format validation

### 4. **Error Handling**
- No stack trace exposure
- Sanitized error messages
- Comprehensive logging

### 5. **Database Security**
- Parameterized queries (Prisma)
- SQL injection prevention
- Soft deletes for data preservation

## 📊 Background Processing

### Read Tracking Flow
```
Article Read Request
    ↓
Controller returns article immediately
    ↓
Fire-and-forget: Queue read event
    ↓
BullMQ Queue (Redis)
    ↓
ReadLog Worker
    ↓
Insert into ReadLog table
```

### Analytics Aggregation Flow
```
Cron Job (Midnight GMT)
    ↓
Queue analytics job
    ↓
BullMQ Queue (Redis)
    ↓
Analytics Worker
    ↓
Aggregate ReadLog by article/date
    ↓
Upsert into DailyAnalytics table
```

## 🧪 Testing Structure

```
src/__tests__/
├── unit/                    # Unit tests
│   └── auth.test.ts        # Auth service tests
├── properties/              # Property-based tests
│   ├── auth.properties.test.ts
│   └── response.properties.test.ts
└── helpers/                 # Test utilities
```

## 📦 Key Dependencies

| Package | Purpose | Layer |
|---------|---------|-------|
| express | HTTP server | Routes/Controllers |
| prisma | Database ORM | Repository |
| zod | Validation | Validators |
| jsonwebtoken | Authentication | Services |
| bcrypt | Password hashing | Services |
| bullmq | Job queue | Workers |
| ioredis | Redis client | Config |
| winston | Logging | Config |
| helmet | Security headers | Middleware |
| jest | Testing | Tests |
| fast-check | Property testing | Tests |

## 🚀 Best Practices Implemented

✅ **Layered Architecture** - Clear separation of concerns
✅ **Type Safety** - TypeScript + Zod + Prisma
✅ **Error Handling** - Global handler with logging
✅ **Security** - JWT, RBAC, input validation
✅ **Testing** - Unit + property-based tests
✅ **Documentation** - Comprehensive README
✅ **Code Quality** - ESLint + Prettier
✅ **Scalability** - Async processing, job queues
✅ **Maintainability** - Clean code, consistent patterns
✅ **Performance** - Database indexes, pagination

---

This structure follows **senior-level backend engineering best practices** and is production-ready.
