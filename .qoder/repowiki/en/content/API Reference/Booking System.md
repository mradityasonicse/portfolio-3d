# Booking System

<cite>
**Referenced Files in This Document**
- [server/index.js](file://server/index.js)
- [server/routes/bookings.js](file://server/routes/bookings.js)
- [server/db/schema.js](file://server/db/schema.js)
- [server/db/connection.js](file://server/db/connection.js)
- [server/middleware/auth.js](file://server/middleware/auth.js)
- [server/routes/auth.js](file://server/routes/auth.js)
- [index.html](file://index.html)
- [Server.java](file://Server.java)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive API documentation for the booking system endpoints. It covers:
- Public appointment booking via POST /api/booking-submit
- Admin access to manage bookings via GET /api/bookings and DELETE /api/bookings/:id
It includes request/response schemas, validation rules, database insertion behavior, response formatting, error handling, and practical curl examples.

## Project Structure
The booking system is implemented in two complementary backend stacks:
- Node.js/Express server with SQLite (recommended)
- Legacy Java HTTP server with SQLite (legacy compatibility)

Key components:
- Express routes for bookings and authentication
- SQLite schema initialization and connection management
- Authentication middleware using JWT
- Frontend integration for public booking submission

```mermaid
graph TB
subgraph "Node.js Backend"
IDX["server/index.js"]
RT_BOOK["server/routes/bookings.js"]
RT_AUTH["server/routes/auth.js"]
MW_AUTH["server/middleware/auth.js"]
DB_CONN["server/db/connection.js"]
DB_SCHEMA["server/db/schema.js"]
end
subgraph "Legacy Java Backend"
JAVA_SERVER["Server.java"]
end
subgraph "Frontend"
HTML["index.html"]
end
HTML --> IDX
IDX --> RT_BOOK
IDX --> RT_AUTH
RT_BOOK --> DB_SCHEMA
RT_BOOK --> DB_CONN
RT_AUTH --> DB_SCHEMA
RT_AUTH --> DB_CONN
MW_AUTH --> RT_AUTH
MW_AUTH --> RT_BOOK
JAVA_SERVER --> |"Legacy compatibility"| RT_BOOK
```

**Diagram sources**
- [server/index.js:1-143](file://server/index.js#L1-L143)
- [server/routes/bookings.js:1-46](file://server/routes/bookings.js#L1-L46)
- [server/routes/auth.js:1-141](file://server/routes/auth.js#L1-L141)
- [server/middleware/auth.js:1-62](file://server/middleware/auth.js#L1-L62)
- [server/db/connection.js:1-25](file://server/db/connection.js#L1-L25)
- [server/db/schema.js:1-287](file://server/db/schema.js#L1-L287)
- [Server.java:1-800](file://Server.java#L1-L800)
- [index.html:1372-1394](file://index.html#L1372-L1394)

**Section sources**
- [server/index.js:1-143](file://server/index.js#L1-L143)
- [server/routes/bookings.js:1-46](file://server/routes/bookings.js#L1-L46)
- [server/db/schema.js:16-24](file://server/db/schema.js#L16-L24)
- [Server.java:110-120](file://Server.java#L110-L120)

## Core Components
- Public booking endpoint: POST /api/booking-submit
  - Validates presence of name, email, booking_date, booking_time, topic
  - Inserts into bookings table with current timestamp
  - Returns standardized success/error response
- Admin booking management:
  - GET /api/bookings: Lists all bookings ordered by creation time (paginated)
  - DELETE /api/bookings/:id: Removes a booking by ID with proper not-found handling
- Authentication:
  - JWT-based access control for admin endpoints
  - Login flow returns access/refresh tokens and manages sessions

**Section sources**
- [server/routes/bookings.js:7-20](file://server/routes/bookings.js#L7-L20)
- [server/routes/bookings.js:22-43](file://server/routes/bookings.js#L22-L43)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)
- [server/routes/auth.js:11-50](file://server/routes/auth.js#L11-L50)

## Architecture Overview
The booking system follows a layered architecture:
- HTTP layer: Express routes and legacy Java handler
- Business logic: Validation and CRUD operations
- Data access: SQLite via better-sqlite3 (Node.js) or JDBC (Java)
- Authentication: JWT middleware and session storage

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Express Server"
participant AuthMW as "Auth Middleware"
participant DB as "SQLite"
Client->>API : "POST /api/bookings"
API->>AuthMW : "Verify JWT"
AuthMW-->>API : "Authorized"
API->>DB : "INSERT INTO bookings"
DB-->>API : "Success"
API-->>Client : "{status : 'success', message : ...}"
```

**Diagram sources**
- [server/routes/bookings.js:22-33](file://server/routes/bookings.js#L22-L33)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)

## Detailed Component Analysis

### Public Booking Submission: POST /api/booking-submit
Purpose:
- Accepts public booking requests and stores them in the database.

Request Schema:
- Content-Type: application/json
- Body fields:
  - name: string, required
  - email: string, required
  - booking_date: string, required
  - booking_time: string, required
  - topic: string, required

Validation Rules:
- All five fields are mandatory; otherwise returns 400 with error message.

Processing Logic:
- Parses JSON body
- Performs field presence checks
- Inserts record into bookings table with auto-generated timestamps

Response Formatting:
- On success: 200 OK with standardized success payload
- On validation failure: 400 Bad Request with error message
- On database error: 500 Internal Server Error with error message

Data Insertion Details:
- Table: bookings
- Columns: name, email, booking_date, booking_time, topic, created_at
- Ordering: created_at timestamp included automatically

```mermaid
flowchart TD
Start(["POST /api/booking-submit"]) --> Parse["Parse JSON body"]
Parse --> Validate{"All fields present?"}
Validate --> |No| Err400["Return 400 with error"]
Validate --> |Yes| Insert["INSERT INTO bookings"]
Insert --> Success["Return 200 success"]
Err400 --> End(["Exit"])
Success --> End
```

**Diagram sources**
- [server/routes/bookings.js:8-20](file://server/routes/bookings.js#L8-L20)
- [server/db/schema.js:16-24](file://server/db/schema.js#L16-L24)

**Section sources**
- [server/routes/bookings.js:7-20](file://server/routes/bookings.js#L7-L20)
- [server/db/schema.js:16-24](file://server/db/schema.js#L16-L24)

### Admin Booking Management: GET /api/bookings and DELETE /api/bookings/:id
Purpose:
- Retrieve paginated list of bookings
- Delete a booking by ID

GET /api/bookings:
- Authentication: Required (JWT Bearer token)
- Pagination: page (default 1), limit (default 50)
- Sorting: Ordered by created_at DESC
- Response includes status, data array, total, page, limit

DELETE /api/bookings/:id:
- Authentication: Required (JWT Bearer token)
- Deletion: Deletes by ID
- Responses:
  - 200 OK on successful deletion
  - 404 Not Found if ID does not exist
  - 400 Bad Request for missing/invalid ID parameter

```mermaid
sequenceDiagram
participant Admin as "Admin Client"
participant API as "Express Server"
participant AuthMW as "Auth Middleware"
participant DB as "SQLite"
Admin->>API : "GET /api/bookings?page=1&limit=50"
API->>AuthMW : "Verify JWT"
AuthMW-->>API : "Authorized"
API->>DB : "SELECT ... ORDER BY created_at DESC LIMIT/OFFSET"
DB-->>API : "Rows"
API-->>Admin : "{status : 'success', data : [], total, page, limit}"
Admin->>API : "DELETE /api/bookings/ : id"
API->>AuthMW : "Verify JWT"
AuthMW-->>API : "Authorized"
API->>DB : "DELETE FROM bookings WHERE id=?"
DB-->>API : "Changes"
API-->>Admin : "{status : 'success', message : 'Booking deleted.'} or 404"
```

**Diagram sources**
- [server/routes/bookings.js:22-43](file://server/routes/bookings.js#L22-L43)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)

**Section sources**
- [server/routes/bookings.js:22-43](file://server/routes/bookings.js#L22-L43)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)

### Authentication and Authorization
- Login: POST /api/auth/login returns access/refresh tokens and updates last_login
- Token verification: authMiddleware validates JWT Bearer token
- Protected endpoints: GET /api/bookings and DELETE /api/bookings/:id require valid JWT
- Legacy compatibility: Java server supports session cookie-based auth for /api/login and /api/bookings

```mermaid
sequenceDiagram
participant User as "Admin User"
participant AuthAPI as "Auth Routes"
participant JWT as "JWT Middleware"
participant DB as "SQLite"
User->>AuthAPI : "POST /api/auth/login {email,password}"
AuthAPI->>DB : "Verify credentials"
DB-->>AuthAPI : "User found"
AuthAPI->>JWT : "Generate access/refresh tokens"
AuthAPI-->>User : "{accessToken, refreshToken, user}"
User->>Protected : "GET /api/bookings (Authorization : Bearer ...)"
Protected->>JWT : "Verify token"
JWT-->>Protected : "Valid"
Protected-->>User : "Bookings data"
```

**Diagram sources**
- [server/routes/auth.js:11-50](file://server/routes/auth.js#L11-L50)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)

**Section sources**
- [server/routes/auth.js:11-50](file://server/routes/auth.js#L11-L50)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)
- [Server.java:354-396](file://Server.java#L354-L396)

## Dependency Analysis
- server/index.js mounts:
  - /api/bookings → server/routes/bookings.js
  - /api/booking-submit → server/routes/bookings.js (legacy alias)
  - /api/auth → server/routes/auth.js
- server/routes/bookings.js depends on:
  - server/db/connection.js for database connection
  - server/db/schema.js for table definitions
  - server/middleware/auth.js for JWT auth
- server/routes/auth.js depends on:
  - server/db/connection.js and server/db/schema.js
  - server/middleware/auth.js for JWT utilities

```mermaid
graph LR
IDX["server/index.js"] --> RT_BOOK["server/routes/bookings.js"]
IDX --> RT_AUTH["server/routes/auth.js"]
RT_BOOK --> DB_CONN["server/db/connection.js"]
RT_BOOK --> DB_SCHEMA["server/db/schema.js"]
RT_AUTH --> DB_SCHEMA
RT_AUTH --> DB_CONN
RT_BOOK --> MW_AUTH["server/middleware/auth.js"]
RT_AUTH --> MW_AUTH
```

**Diagram sources**
- [server/index.js:12-52](file://server/index.js#L12-L52)
- [server/routes/bookings.js:1-5](file://server/routes/bookings.js#L1-L5)
- [server/db/connection.js:1-25](file://server/db/connection.js#L1-L25)
- [server/db/schema.js:1-7](file://server/db/schema.js#L1-L7)
- [server/middleware/auth.js:1-62](file://server/middleware/auth.js#L1-L62)

**Section sources**
- [server/index.js:12-52](file://server/index.js#L12-L52)
- [server/routes/bookings.js:1-5](file://server/routes/bookings.js#L1-L5)

## Performance Considerations
- SQLite is suitable for small to medium loads; consider indexing on frequently queried columns if growth warrants it
- The GET /api/bookings endpoint supports pagination via page and limit parameters
- JWT middleware adds minimal overhead; ensure token expiration aligns with operational needs

## Troubleshooting Guide
Common error scenarios and resolutions:
- Validation failures (400):
  - Cause: Missing required fields in POST /api/booking-submit
  - Resolution: Ensure name, email, booking_date, booking_time, topic are provided
- Unauthorized access (401):
  - Cause: Missing or invalid Authorization header for admin endpoints
  - Resolution: Authenticate via POST /api/auth/login and include Bearer token
- Not found (404):
  - Cause: DELETE /api/bookings/:id with non-existent ID
  - Resolution: Verify booking ID exists before attempting deletion
- Database errors (500):
  - Cause: SQLite operation failures
  - Resolution: Check server logs and database connectivity

**Section sources**
- [server/routes/bookings.js:11-13](file://server/routes/bookings.js#L11-L13)
- [server/middleware/auth.js:23-40](file://server/middleware/auth.js#L23-L40)
- [server/routes/bookings.js:39-41](file://server/routes/bookings.js#L39-L41)

## Practical Examples

### Public Booking Submission (curl)
```bash
curl -X POST http://localhost:3000/api/booking-submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "booking_date": "2025-06-15",
    "booking_time": "14:30",
    "topic": "Consultation"
  }'
```

### Admin: List Bookings (curl)
```bash
curl -X GET "http://localhost:3000/api/bookings?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Admin: Cancel Booking by ID (curl)
```bash
curl -X DELETE "http://localhost:3000/api/bookings/123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Notes:
- Replace YOUR_ACCESS_TOKEN_HERE with a valid JWT obtained from POST /api/auth/login
- The frontend integrates with POST /api/booking-submit via JavaScript fetch

**Section sources**
- [index.html:1387-1394](file://index.html#L1387-L1394)
- [server/routes/auth.js:11-50](file://server/routes/auth.js#L11-L50)

## Conclusion
The booking system provides a straightforward public submission endpoint and robust admin controls with JWT-based authentication. The design emphasizes simplicity and reliability using SQLite and clear response schemas. For production deployments, consider adding input sanitization, rate limiting, and database indexing as appropriate.