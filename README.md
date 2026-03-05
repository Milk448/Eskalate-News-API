# News API — Production-Ready Backend

A robust, scalable RESTful API built with **Node.js**, **TypeScript**, **Express**, and **PostgreSQL**. Authors publish content; Readers consume it. A built-in Analytics Engine records high-frequency read events asynchronously and aggregates them into daily reports via a BullMQ job queue.

> **Repository:** https://github.com/Milk448/Eskalate-News-API

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Technology Choices](#technology-choices)

## ✨ Features

- 🔐 **JWT Authentication** — Secure token-based auth with bcrypt password hashing
- 👥 **Role-Based Access Control (RBAC)** — Separate permissions for Authors and Readers
- 📝 **Article Management** — Full CRUD with soft deletion (no data is permanently removed)
- 🔍 **Advanced Search & Filtering** — Filter by category, partial author name, and title keywords
- 📊 **Analytics Engine** — BullMQ job queue aggregates daily read counts into `DailyAnalytics`
- 🚀 **Asynchronous Read Tracking** — Read events are queued fire-and-forget so article responses are never blocked
- 🛑 **Duplicate-Read Throttling** — Redis-backed 60-second window prevents the same user/IP from flooding `ReadLog`
- 🚦 **Rate Limiting** — `express-rate-limit` applied to auth (10 req/15 min) and API routes (100 req/15 min)
- ✅ **Input Validation** — Centralized Zod schemas for all request bodies and query params
- 🛡️ **Security Best Practices** — Helmet headers, CORS, no stack-trace exposure to clients
- 📖 **Standardised Responses** — Every endpoint returns the same `{ Success, Message, Object, Errors }` envelope

## 🛠 Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Language** | TypeScript | Type-safe development |
| **Framework** | Express.js | HTTP server framework |
| **Database** | PostgreSQL 14+ | Relational database |
| **ORM** | Prisma | Type-safe database client |
| **Authentication** | JWT + bcrypt | Secure auth & password hashing |
| **Validation** | Zod | Runtime schema validation |
| **Job Queue** | BullMQ | Background job processing |
| **Cache/Queue** | Redis 6+ | In-memory data store |
| **Cron Jobs** | node-cron | Scheduled task execution |
| **Testing** | Jest + fast-check | Unit & property-based testing |
| **Logging** | Winston | Structured logging |
| **Security** | Helmet | Security headers |

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download](https://redis.io/download)
- **npm** or **yarn** - Package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Milk448/Eskalate-News-API.git
   cd Eskalate-News-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

4. **Generate the Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🔐 Environment Variables

Copy the provided template and fill in your values:

```bash
cp .env.example .env
```

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/news_api

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100   # requests per window (API routes)

# CORS
CORS_ORIGIN=*
```

### Environment Variable Details

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode (`development`/`production`/`test`) | No | `development` |
| `PORT` | Server port | No | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | — |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | **Yes** | — |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | `24h` |
| `REDIS_HOST` | Redis server host | No | `localhost` |
| `REDIS_PORT` | Redis server port | No | `6379` |
| `REDIS_PASSWORD` | Redis password (if required) | No | — |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds | No | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP (API routes) | No | `100` |
| `CORS_ORIGIN` | Allowed CORS origins | No | `*` |

## 🗄 Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE news_api;

# Exit psql
\q
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Migrations

```bash
npx prisma migrate dev
```

### 4. (Optional) Seed Sample Data

```bash
npm run seed
```

This creates sample users and articles for development/testing.

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:3000` with hot-reload enabled.

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Response Format

All API responses follow this standardized format:

**Success Response:**
```json
{
  "Success": true,
  "Message": "Operation successful",
  "Object": { /* data */ },
  "Errors": null
}
```

**Error Response:**
```json
{
  "Success": false,
  "Message": "Error message",
  "Object": null,
  "Errors": ["Detailed error 1", "Detailed error 2"]
}
```

**Paginated Response:**
```json
{
  "Success": true,
  "Message": "Data retrieved successfully",
  "Object": [ /* array of items */ ],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 45,
  "Errors": null
}
```

---

### 🔓 Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "author"
}
```

**Validation Rules:**
- `name`: Only alphabets and spaces
- `email`: Valid email format
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `role`: Either "author" or "reader"

**Response (201):**
```json
{
  "Success": true,
  "Message": "User registered successfully",
  "Object": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "author",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "Errors": null
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "Success": true,
  "Message": "Login successful",
  "Object": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "author"
    }
  },
  "Errors": null
}
```

---

### 📰 Public Article Endpoints

#### Get All Published Articles

```http
GET /articles?category=Tech&author=John&q=typescript&page=1&size=10
```

**Query Parameters:**
- `category` (optional): Filter by exact category match
- `author` (optional): Filter by partial author name match
- `q` (optional): Search keyword in article title
- `page` (optional): Page number (default: 1)
- `size` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "Success": true,
  "Message": "Articles retrieved successfully",
  "Object": [
    {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "content": "Article content...",
      "category": "Tech",
      "status": "Published",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 45,
  "Errors": null
}
```

#### Get Article by ID

```http
GET /articles/:id
```

**Note:** This endpoint tracks the read event asynchronously.

**Response (200):**
```json
{
  "Success": true,
  "Message": "Article retrieved successfully",
  "Object": {
    "id": "uuid",
    "title": "Article Title",
    "content": "Full article content...",
    "category": "Tech",
    "status": "Published",
    "author": {
      "id": "uuid",
      "name": "John Doe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "Errors": null
}
```

---

### ✍️ Author-Only Endpoints

**Note:** All author endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### Create Article

```http
POST /articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Article Title",
  "content": "Article content must be at least 50 characters long to meet validation requirements.",
  "category": "Tech",
  "status": "Published"
}
```

**Validation Rules:**
- `title`: 1-150 characters
- `content`: Minimum 50 characters
- `category`: Required string
- `status`: "Draft" or "Published" (default: "Draft")

**Response (201):**
```json
{
  "Success": true,
  "Message": "Article created successfully",
  "Object": {
    "id": "uuid",
    "title": "My Article Title",
    "content": "Article content...",
    "category": "Tech",
    "status": "Published",
    "authorId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "Errors": null
}
```

#### Get My Articles

```http
GET /articles/me?includeDeleted=false&page=1&size=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `includeDeleted` (optional): Include soft-deleted articles (default: false)
- `page` (optional): Page number (default: 1)
- `size` (optional): Items per page (default: 10)

**Response (200):** Paginated list of author's articles (including drafts)

#### Update Article

```http
PUT /articles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "Published"
}
```

**Note:** Only the article owner can update it.

**Response (200):**
```json
{
  "Success": true,
  "Message": "Article updated successfully",
  "Object": { /* updated article */ },
  "Errors": null
}
```

#### Delete Article (Soft Delete)

```http
DELETE /articles/:id
Authorization: Bearer <token>
```

**Note:** This performs a soft delete (sets `deletedAt` timestamp). The article is not removed from the database.

**Response (200):**
```json
{
  "Success": true,
  "Message": "Article deleted successfully",
  "Object": null,
  "Errors": null
}
```

---

### 📊 Dashboard Endpoint

#### Get Author Dashboard

```http
GET /author/dashboard?page=1&size=10
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "Success": true,
  "Message": "Dashboard data retrieved successfully",
  "Object": [
    {
      "id": "uuid",
      "title": "Article Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "totalViews": 150
    }
  ],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 25,
  "Errors": null
}
```

---

### 🏥 Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 📁 Project Structure

```
Eskalate-News-API/
├── prisma/
│   ├── schema.prisma        # Data models: User, Article, ReadLog, DailyAnalytics
│   └── seed.ts              # Sample data seeding script
├── src/
│   ├── config/              # App-wide configuration
│   │   ├── database.ts      # Prisma client + soft-delete middleware
│   │   ├── env.ts           # Zod-validated environment variables
│   │   ├── logger.ts        # Winston structured logger
│   │   ├── queue.ts         # BullMQ queue definitions
│   │   └── redis.ts         # ioredis client
│   ├── controllers/         # HTTP request handlers (thin layer)
│   │   ├── article.controller.ts
│   │   ├── auth.controller.ts
│   │   └── dashboard.controller.ts
│   ├── jobs/                # Scheduled tasks
│   │   └── analytics.cron.ts  # Midnight GMT cron → queues aggregation job
│   ├── middleware/          # Express middleware
│   │   ├── __tests__/
│   │   │   └── errorHandler.test.ts
│   │   ├── auth.ts          # JWT authentication (+ optional auth)
│   │   ├── errorHandler.ts  # Global error handler (no stack traces to clients)
│   │   ├── rateLimiter.ts   # express-rate-limit (auth: 10/15 min, API: 100/15 min)
│   │   └── rbac.ts          # Role-based access control
│   ├── repositories/        # Data-access layer (Prisma queries)
│   │   └── article.repository.ts
│   ├── routes/              # Express routers
│   │   ├── article.routes.ts
│   │   ├── auth.routes.ts
│   │   └── dashboard.routes.ts
│   ├── services/            # Business logic
│   │   ├── analytics.service.ts   # Daily aggregation + dashboard queries
│   │   ├── article.service.ts     # Article CRUD + ownership checks
│   │   ├── auth.service.ts        # Registration, login, JWT
│   │   ├── readLog.service.ts     # Enqueues read events (fire-and-forget)
│   │   └── readThrottle.service.ts # Redis 60-s window to deduplicate reads
│   ├── types/               # Shared TypeScript interfaces & enums
│   │   └── index.ts
│   ├── utils/               # Pure helpers
│   │   └── response.ts      # sendSuccess / sendError / sendPaginated
│   ├── validators/          # Zod schemas (single source of truth)
│   │   ├── article.validator.ts
│   │   └── auth.validator.ts
│   ├── workers/             # BullMQ workers (run in same process)
│   │   ├── analytics.worker.ts  # Processes analytics aggregation jobs
│   │   └── readLog.worker.ts    # Persists ReadLog rows from queue
│   ├── __tests__/           # Automated tests
│   │   ├── helpers/
│   │   │   └── prisma-mock.ts
│   │   ├── integration/
│   │   │   ├── article.http.test.ts
│   │   │   ├── auth.enhanced.test.ts
│   │   │   └── auth.http.test.ts
│   │   ├── properties/
│   │   │   ├── auth.properties.test.ts
│   │   │   └── response.properties.test.ts
│   │   └── unit/
│   │       ├── auth.test.ts
│   │       └── readThrottle.test.ts
│   ├── app.ts               # createApp() — Express config, routes, error handler
│   └── server.ts            # Entry point — DB connect, start server, start cron
├── .env.example             # Environment variable template
├── jest.config.js           # Jest + ts-jest configuration
├── jest.setup.ts            # Injects test env vars before module load
├── package.json
├── tsconfig.json
└── README.md
```

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           Express Server                │
├─────────────────────────────────────────┤
│  Routes → Controllers → Services        │
│                ↓                         │
│           Repositories                  │
│                ↓                         │
│         Prisma ORM                      │
│                ↓                         │
│       PostgreSQL Database               │
└─────────────────────────────────────────┘

Background Processing:
┌─────────────────────────────────────────┐
│     BullMQ Queue (Redis)                │
│              ↓                           │
│         Workers                          │
│    - ReadLog Worker                     │
│    - Analytics Worker                   │
└─────────────────────────────────────────┘
```

## 🏗 Architecture

### Design Patterns

1. **Layered Architecture**
   - **Controllers**: Handle HTTP requests/responses
   - **Services**: Business logic and orchestration
   - **Repositories**: Data access and query building
   - **Models**: Database schema (Prisma)

2. **Repository Pattern**
   - Abstracts database operations
   - Makes testing easier with mocks
   - Centralizes query logic

3. **Middleware Pattern**
   - Authentication
   - Authorization (RBAC)
   - Error handling
   - Request logging

4. **Fire-and-Forget Pattern**
   - Read tracking doesn't block responses
   - Events queued for async processing

### Key Features

#### 1. Soft Delete Implementation

Articles are never permanently deleted. Instead, a `deletedAt` timestamp is set, and a Prisma middleware automatically excludes those records from public-facing queries:

```typescript
// src/config/database.ts — runs on every findUnique / findMany for Article
prisma.$use(async (params, next) => {
  if (params.model === 'Article') {
    if (params.action === 'findUnique') {
      params.action = 'findFirst';
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === 'findMany') {
      params.args.where = params.args.where ?? {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }
  return next(params);
});
```

#### 2. Asynchronous Read Tracking

Read events are enqueued fire-and-forget so the article response is **never blocked**:

```typescript
// Controller — response is sent before the queue job completes
readLogService.recordRead(articleId, readerId, ipAddress).catch(() => {});
sendSuccess(res, 'Article retrieved successfully', article);
```

#### 3. Duplicate-Read Throttling (Bonus)

To prevent a single user refreshing the page from flooding `ReadLog`, a Redis key with a 60-second TTL is set on the first read. Subsequent requests within the window are silently skipped:

```
Key: read:throttle:{articleId}:{userId|ipAddress}
TTL: 60 seconds
Strategy: SET … NX EX — atomic, fails-open if Redis is unavailable
```

#### 4. Daily Analytics Aggregation

A `node-cron` job fires at midnight **GMT** every day, queuing a BullMQ job that groups `ReadLog` rows by `articleId + date` and upserts the result into `DailyAnalytics`:

```typescript
// src/jobs/analytics.cron.ts
cron.schedule('0 0 * * *', async () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  await analyticsQueue.add('aggregate-daily', { date: yesterday });
}, { timezone: 'GMT' });
```

#### 5. Role-Based Access Control

```typescript
// Protect routes with RBAC middleware
router.post('/articles',
  apiRateLimiter,            // Rate limit
  authenticate,              // Verify JWT
  requireRole(Role.author),  // Check role
  articleController.create
);
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Testing Strategy

1. **Unit Tests** — Test individual service methods in isolation (mocked DB & Redis)
2. **Integration Tests** — Full HTTP request/response cycle via `supertest` (mocked DB)
3. **Property-Based Tests** — Verify universal invariants across thousands of generated inputs with `fast-check`

### Test Structure

```
src/
├── middleware/
│   └── __tests__/
│       └── errorHandler.test.ts   # Error-handler middleware
└── __tests__/
    ├── helpers/
    │   └── prisma-mock.ts
    ├── integration/
    │   ├── article.http.test.ts
    │   ├── auth.enhanced.test.ts
    │   └── auth.http.test.ts
    ├── properties/
    │   ├── auth.properties.test.ts
    │   └── response.properties.test.ts
    └── unit/
        ├── auth.test.ts
        └── readThrottle.test.ts
```

> All database calls are mocked — **no live database or Redis is needed to run the test suite**.

## 💡 Technology Choices

### Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Self-Documenting**: Types serve as documentation
- **Maintainability**: Easier to refactor large codebases

### Why Prisma?

- **Type-Safe**: Auto-generated types from schema
- **Migration System**: Version-controlled schema changes
- **Query Builder**: Intuitive and powerful
- **Performance**: Optimized queries

### Why Zod?

- **Runtime Validation**: Validates data at runtime
- **Type Inference**: Automatically generates TypeScript types
- **Composable**: Build complex schemas from simple ones
- **Error Messages**: Clear, customizable error messages

### Why BullMQ + Redis?

- **Reliability**: Persistent job queue
- **Scalability**: Horizontal scaling with multiple workers
- **Performance**: Fast in-memory operations
- **Features**: Retry logic, job prioritization, rate limiting

### Why Soft Deletes?

- **Data Preservation**: Never lose data
- **Audit Trail**: Track what was deleted and when
- **Recovery**: Can restore deleted items
- **Compliance**: Meet regulatory requirements

## 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Authentication**: Stateless token-based auth
- ✅ **Role-Based Access Control**: Granular permissions
- ✅ **Input Validation**: Zod schemas prevent invalid data
- ✅ **SQL Injection Prevention**: Prisma parameterized queries
- ✅ **XSS Protection**: Helmet security headers
- ✅ **CORS**: Configurable origin restrictions
- ✅ **Rate Limiting**: `express-rate-limit` — 10 req/15 min on auth, 100 req/15 min on API routes
- ✅ **No Stack Trace Exposure**: Errors logged but not sent to clients

## 📈 Performance Optimizations

### Database Indexes

```prisma
@@index([status, deletedAt])    // Public article feed (published + not deleted)
@@index([authorId])              // Author's own article list
@@index([articleId, readAt])     // Analytics aggregation window queries
@@unique([articleId, date])      // DailyAnalytics upsert constraint
```

### Async Processing

- Read tracking uses a BullMQ job queue — **zero blocking** on the API response cycle
- Analytics aggregation runs entirely in the background via a dedicated worker
- Redis SCAN (non-blocking) used instead of KEYS for throttle statistics

### Pagination

- All list endpoints support `page` / `size` query parameters (default: page 1, size 10)
- Every paginated response includes `TotalSize` for client-side pagination controls

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Pre-Deploy Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` (32+ characters)
- [ ] Configure `DATABASE_URL` for production PostgreSQL
- [ ] Provision a Redis instance and set `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`
- [ ] Set `CORS_ORIGIN` to your specific frontend domain(s)
- [ ] Enable SSL/TLS for database and Redis connections
- [ ] Set up log aggregation (Winston writes to `logs/combined.log` and `logs/error.log`)
- [ ] Configure uptime monitoring and alerting

## 📝 License

MIT

## 👤 Author

Built for the A2SV Eskalate Backend Assessment — demonstrating production-grade Node.js practices: security, async processing, testing, and clean architecture.
