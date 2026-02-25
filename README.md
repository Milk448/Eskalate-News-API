# News API - Production-Ready Backend

A robust, scalable RESTful API built with Node.js, TypeScript, Express, and PostgreSQL. This API enables Authors to publish content and Readers to consume it, featuring a comprehensive Analytics Engine that tracks user engagement and processes view counts into daily reports.

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

- 🔐 **JWT Authentication** - Secure token-based authentication with bcrypt password hashing
- 👥 **Role-Based Access Control (RBAC)** - Separate permissions for Authors and Readers
- 📝 **Article Management** - Full CRUD operations with soft deletion
- 🔍 **Advanced Search & Filtering** - Search by category, author name, and keywords
- 📊 **Analytics Engine** - Background job processing for daily view count aggregation
- 🚀 **Asynchronous Processing** - BullMQ with Redis for high-performance event tracking
- ✅ **Input Validation** - Zod schemas for runtime type validation
- 🛡️ **Security Best Practices** - Helmet, CORS, rate limiting, no stack trace exposure
- 📖 **Comprehensive API** - RESTful endpoints with standardized responses

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
   git clone <your-repository-url>
   cd news-api
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

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

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

# CORS
CORS_ORIGIN=*
```

### Environment Variable Details

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode (development/production/test) | No | development |
| `PORT` | Server port | No | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | - |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | **Yes** | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | 24h |
| `REDIS_HOST` | Redis server host | No | localhost |
| `REDIS_PORT` | Redis server port | No | 6379 |
| `REDIS_PASSWORD` | Redis password (if required) | No | - |
| `CORS_ORIGIN` | Allowed CORS origins | No | * |

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

### 2. Run Migrations

```bash
npx prisma migrate dev
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. (Optional) Seed Sample Data

```bash
npm run seed
```

This creates sample users and articles for testing.

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
news-api/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Database schema definition
│   └── seed.ts             # Database seeding script
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.ts     # Prisma client & soft delete middleware
│   │   ├── env.ts          # Environment variable validation
│   │   ├── logger.ts       # Winston logger configuration
│   │   ├── queue.ts        # BullMQ queue setup
│   │   └── redis.ts        # Redis client configuration
│   ├── controllers/        # Request handlers
│   │   ├── article.controller.ts
│   │   ├── auth.controller.ts
│   │   └── dashboard.controller.ts
│   ├── jobs/               # Cron jobs
│   │   └── analytics.cron.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── errorHandler.ts # Global error handler
│   │   └── rbac.ts         # Role-based access control
│   ├── repositories/       # Data access layer
│   │   └── article.repository.ts
│   ├── routes/             # API routes
│   │   ├── article.routes.ts
│   │   ├── auth.routes.ts
│   │   └── dashboard.routes.ts
│   ├── services/           # Business logic
│   │   ├── analytics.service.ts
│   │   ├── article.service.ts
│   │   ├── auth.service.ts
│   │   └── readLog.service.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── response.ts     # Response formatters
│   ├── validators/         # Zod validation schemas
│   │   ├── article.validator.ts
│   │   └── auth.validator.ts
│   ├── workers/            # Background job workers
│   │   ├── analytics.worker.ts
│   │   └── readLog.worker.ts
│   ├── __tests__/          # Test files
│   │   ├── unit/
│   │   └── properties/
│   ├── app.ts              # Express app configuration
│   └── server.ts           # Server entry point
├── .env.example            # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Git ignore rules
├── .prettierrc             # Prettier configuration
├── jest.config.js          # Jest testing configuration
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
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

Articles are never permanently deleted. Instead, a `deletedAt` timestamp is set:

```typescript
// Prisma middleware automatically filters deleted records
prisma.$use(async (params, next) => {
  if (params.model === 'Article') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = params.args.where || {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }
  return next(params);
});
```

#### 2. Asynchronous Read Tracking

Read events are tracked without blocking the article response:

```typescript
// Fire-and-forget pattern
readLogService.trackRead(articleId, readerId).catch(err => {
  logger.error('Failed to track read:', err);
});
// Response continues immediately
```

#### 3. Daily Analytics Aggregation

A cron job runs at midnight GMT to aggregate analytics:

```typescript
// Runs daily at 00:00 GMT
cron.schedule('0 0 * * *', async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await analyticsQueue.add('aggregate', { date: yesterday });
}, { timezone: 'GMT' });
```

#### 4. Role-Based Access Control

```typescript
// Protect routes with RBAC middleware
router.post('/articles',
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

1. **Unit Tests**: Test individual functions and methods
2. **Property-Based Tests**: Test universal properties with fast-check
3. **Integration Tests**: Test API endpoints with real database

### Test Structure

```
src/__tests__/
├── unit/
│   └── auth.test.ts
├── properties/
│   ├── auth.properties.test.ts
│   └── response.properties.test.ts
└── middleware/
    └── __tests__/
        └── errorHandler.test.ts
```

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
- ✅ **Rate Limiting**: Redis-based rate limiting (infrastructure ready)
- ✅ **No Stack Trace Exposure**: Errors logged but not sent to clients

## 📈 Performance Optimizations

### Database Indexes

```prisma
@@index([status, deletedAt])  // Public article queries
@@index([authorId])            // Author queries
@@index([articleId, readAt])   // Analytics aggregation
@@unique([articleId, date])    // Daily analytics constraint
```

### Async Processing

- Read tracking uses job queue (non-blocking)
- Analytics aggregation runs in background
- Separate worker processes

### Pagination

- All list endpoints support pagination
- Prevents loading large datasets
- Includes total count for UI

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure `DATABASE_URL` for production database
- [ ] Set up Redis instance
- [ ] Configure `CORS_ORIGIN` to specific domains
- [ ] Enable SSL/TLS for database connections
- [ ] Set up logging aggregation
- [ ] Configure monitoring and alerts

## 📝 License

MIT

## 👤 Author

Built for the A2SV Eskalate Backend Assessment

---

**Note**: This is a production-ready implementation demonstrating best practices in backend development, including security, scalability, testing, and documentation.
