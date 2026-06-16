# Component Interactions

<cite>
**Referenced Files in This Document**
- [Server.java](file://Server.java)
- [main.js](file://main.js)
- [login.html](file://login.html)
- [admin.html](file://admin.html)
- [contact.html](file://contact.html)
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
This document explains how the Premium Portfolio system orchestrates communication among its frontend JavaScript, Java HTTP handlers, and SQLite database. It focuses on the handler pattern, authentication via session cookies, CORS configuration, and data serialization across component boundaries. Sequence diagrams illustrate typical user workflows such as contact form submission, admin login, and content management operations.

## Project Structure
The system comprises:
- A Java HTTP server exposing REST endpoints and serving static assets
- Frontend pages (contact, login, admin) using AJAX to communicate with the server
- A SQLite database storing contacts, bookings, portfolio settings, and content items

```mermaid
graph TB
subgraph "Browser"
FE_JS["main.js"]
FE_LOGIN["login.html"]
FE_ADMIN["admin.html"]
FE_CONTACT["contact.html"]
end
subgraph "Java Server"
HTTP["HttpServer"]
STATIC["StaticFileHandler"]
LOGIN["LoginHandler"]
CONTACT["ContactHandler"]
BOOKSUBMIT["BookingSubmitHandler"]
MSGS["MessagesHandler"]
BOOKS["BookingsHandler"]
SETTINGS["SettingsHandler"]
CRUD_PROJ["ProjectsCrudHandler"]
CRUD_EDU["EducationCrudHandler"]
CRUD_EXP["ExperienceCrudHandler"]
end
subgraph "Database"
SQLITE["SQLite: portfolio.db"]
end
FE_JS --> |AJAX| HTTP
FE_LOGIN --> |AJAX| HTTP
FE_ADMIN --> |AJAX| HTTP
FE_CONTACT --> |AJAX| HTTP
HTTP --> STATIC
HTTP --> LOGIN
HTTP --> CONTACT
HTTP --> BOOKSUBMIT
HTTP --> MSGS
HTTP --> BOOKS
HTTP --> SETTINGS
HTTP --> CRUD_PROJ
HTTP --> CRUD_EDU
HTTP --> CRUD_EXP
STATIC --> SQLITE
LOGIN --> SQLITE
CONTACT --> SQLITE
BOOKSUBMIT --> SQLITE
MSGS --> SQLITE
BOOKS --> SQLITE
SETTINGS --> SQLITE
CRUD_PROJ --> SQLITE
CRUD_EDU --> SQLITE
CRUD_EXP --> SQLITE
```

**Diagram sources**
- [Server.java:34-83](file://Server.java#L34-L83)
- [main.js:76-136](file://main.js#L76-L136)
- [login.html:146-171](file://login.html#L146-L171)
- [admin.html:1188-1254](file://admin.html#L1188-L1254)
- [contact.html:143-150](file://contact.html#L143-L150)

**Section sources**
- [Server.java:34-83](file://Server.java#L34-L83)

## Core Components
- StaticFileHandler: Serves HTML/CSS/JS and enforces authentication for admin routes
- LoginHandler: Validates credentials and sets a session cookie
- ContactHandler: Inserts contact messages into SQLite
- BookingSubmitHandler: Inserts booking requests into SQLite
- MessagesHandler: Lists and deletes contact messages (admin protected)
- BookingsHandler: Lists and deletes booking requests (admin protected)
- SettingsHandler: Reads and updates portfolio settings and content lists
- CRUD Handlers: Manage projects, education, and experience content (admin protected)

Key behaviors:
- CORS: All API handlers set permissive CORS headers and handle OPTIONS preflight
- Authentication: Session cookie presence validated centrally; admin routes redirect unauthenticated users
- Serialization: JSON bodies parsed and escaped; responses formatted consistently

**Section sources**
- [Server.java:398-411](file://Server.java#L398-L411)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:804-904](file://Server.java#L804-L904)
- [Server.java:354-396](file://Server.java#L354-L396)
- [Server.java:494-554](file://Server.java#L494-L554)
- [Server.java:738-800](file://Server.java#L738-L800)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)

## Architecture Overview
The server initializes SQLite, registers HTTP contexts for handlers, and streams static assets. Frontend pages use fetch to call API endpoints. Responses are JSON with consistent status and message fields. Admin pages rely on session cookies for access control.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant AdminUI as "admin.html"
participant Server as "HttpServer"
participant Handler as "SettingsHandler"
participant DB as "SQLite"
Browser->>AdminUI : Load /admin
AdminUI->>Server : GET /admin
Server->>Server : StaticFileHandler checks auth
alt Unauthenticated
Server-->>Browser : 302 Redirect to /login.html
else Authenticated
AdminUI->>Server : GET /api/settings
Server->>Handler : Dispatch
Handler->>DB : SELECT settings + content
DB-->>Handler : Rows
Handler-->>AdminUI : JSON {settings, projects, education, experience}
end
```

**Diagram sources**
- [Server.java:826-832](file://Server.java#L826-L832)
- [Server.java:906-1058](file://Server.java#L906-L1058)
- [admin.html:1188-1254](file://admin.html#L1188-L1254)

**Section sources**
- [Server.java:826-832](file://Server.java#L826-L832)
- [Server.java:906-1058](file://Server.java#L906-L1058)
- [admin.html:1188-1254](file://admin.html#L1188-L1254)

## Detailed Component Analysis

### Handler Pattern and Routing
- StaticFileHandler: Rewrites URLs, enforces canonical paths, prevents directory traversal, and serves static assets
- LoginHandler: Accepts POST with JSON body, validates hardcoded credentials, sets HttpOnly session cookie, and responds with JSON
- ContactHandler: Accepts POST with JSON or form-encoded body, inserts into contacts, and responds with JSON
- BookingSubmitHandler: Accepts POST with JSON or form-encoded body, inserts into bookings, and responds with JSON
- MessagesHandler: GET returns all contacts; DELETE removes by id; requires authentication
- BookingsHandler: GET returns all bookings; DELETE removes by id; requires authentication
- SettingsHandler: GET returns combined settings and content; POST updates settings (requires authentication)
- CRUD Handlers: POST creates/updates items; DELETE removes by id; require authentication

```mermaid
classDiagram
class StaticFileHandler {
+handle(exchange)
-getMimeType(filename)
}
class LoginHandler {
+handle(exchange)
}
class ContactHandler {
+handle(exchange)
}
class BookingSubmitHandler {
+handle(exchange)
}
class MessagesHandler {
+handle(exchange)
}
class BookingsHandler {
+handle(exchange)
}
class SettingsHandler {
+handle(exchange)
}
class ProjectsCrudHandler {
+handle(exchange)
}
class EducationCrudHandler {
+handle(exchange)
}
class ExperienceCrudHandler {
+handle(exchange)
}
StaticFileHandler <.. LoginHandler : "serves static"
StaticFileHandler <.. ContactHandler : "serves static"
StaticFileHandler <.. BookingSubmitHandler : "serves static"
StaticFileHandler <.. MessagesHandler : "serves static"
StaticFileHandler <.. BookingsHandler : "serves static"
StaticFileHandler <.. SettingsHandler : "serves static"
StaticFileHandler <.. ProjectsCrudHandler : "serves static"
StaticFileHandler <.. EducationCrudHandler : "serves static"
StaticFileHandler <.. ExperienceCrudHandler : "serves static"
```

**Diagram sources**
- [Server.java:804-904](file://Server.java#L804-L904)
- [Server.java:354-396](file://Server.java#L354-L396)
- [Server.java:494-554](file://Server.java#L494-L554)
- [Server.java:738-800](file://Server.java#L738-L800)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)

**Section sources**
- [Server.java:804-904](file://Server.java#L804-L904)
- [Server.java:354-396](file://Server.java#L354-L396)
- [Server.java:494-554](file://Server.java#L494-L554)
- [Server.java:738-800](file://Server.java#L738-L800)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)

### Authentication Flow (Admin Login)
- Frontend posts credentials to /api/login
- Server validates and sets a session cookie
- Subsequent admin requests include the cookie and are accepted

```mermaid
sequenceDiagram
participant User as "User"
participant LoginPage as "login.html"
participant Server as "HttpServer"
participant LoginH as "LoginHandler"
participant DB as "SQLite"
User->>LoginPage : Enter credentials
LoginPage->>Server : POST /api/login {username,password}
Server->>LoginH : Dispatch
LoginH->>DB : Validate credentials
DB-->>LoginH : OK/Not found
alt Valid
LoginH-->>LoginPage : 200 JSON + Set-Cookie session_id
LoginPage-->>User : Redirect to /admin
else Invalid
LoginH-->>LoginPage : 401 JSON error
LoginPage-->>User : Show error banner
end
```

**Diagram sources**
- [login.html:146-171](file://login.html#L146-L171)
- [Server.java:354-396](file://Server.java#L354-L396)

**Section sources**
- [login.html:146-171](file://login.html#L146-L171)
- [Server.java:354-396](file://Server.java#L354-L396)

### Contact Form Submission Workflow
- Frontend gathers form data and sends JSON to /api/contact
- Server parses body, validates required fields, inserts into contacts, and responds

```mermaid
sequenceDiagram
participant Visitor as "Visitor"
participant ContactPage as "contact.html"
participant Server as "HttpServer"
participant ContactH as "ContactHandler"
participant DB as "SQLite"
Visitor->>ContactPage : Submit message form
ContactPage->>Server : POST /api/contact {name,email,message}
Server->>ContactH : Dispatch
ContactH->>DB : INSERT INTO contacts
DB-->>ContactH : OK
ContactH-->>ContactPage : 200 JSON success
ContactPage-->>Visitor : Show success message
```

**Diagram sources**
- [contact.html:143-150](file://contact.html#L143-L150)
- [Server.java:494-554](file://Server.java#L494-L554)

**Section sources**
- [contact.html:143-150](file://contact.html#L143-L150)
- [Server.java:494-554](file://Server.java#L494-L554)

### Admin Dashboard Data Retrieval
- Admin page fetches settings and content lists from /api/settings
- Renders stats, messages, bookings, and manages content via CRUD endpoints

```mermaid
sequenceDiagram
participant Admin as "admin.html"
participant Server as "HttpServer"
participant SettingsH as "SettingsHandler"
participant DB as "SQLite"
Admin->>Server : GET /api/settings
Server->>SettingsH : Dispatch
SettingsH->>DB : SELECT portfolio_settings + content tables
DB-->>SettingsH : Rows
SettingsH-->>Admin : 200 JSON {settings, projects, education, experience}
Admin-->>Admin : Render UI with fetched data
```

**Diagram sources**
- [admin.html:1188-1254](file://admin.html#L1188-L1254)
- [Server.java:906-1058](file://Server.java#L906-L1058)

**Section sources**
- [admin.html:1188-1254](file://admin.html#L1188-L1254)
- [Server.java:906-1058](file://Server.java#L906-L1058)

### Content Management Operations (CRUD)
- Admin UI posts updates to /api/projects-crud, /api/education-crud, /api/experience-crud
- Server validates inputs, performs INSERT/UPDATE/DELETE, and responds with JSON

```mermaid
sequenceDiagram
participant Admin as "admin.html"
participant Server as "HttpServer"
participant ProjH as "ProjectsCrudHandler"
participant DB as "SQLite"
Admin->>Server : POST /api/projects-crud {id,title,...}
Server->>ProjH : Dispatch
ProjH->>DB : INSERT/UPDATE projects
DB-->>ProjH : OK
ProjH-->>Admin : 200/201 JSON success
Admin-->>Admin : Refresh list and show success
```

**Diagram sources**
- [admin.html:1078-1138](file://admin.html#L1078-L1138)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)

**Section sources**
- [admin.html:1078-1138](file://admin.html#L1078-L1138)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)

### Request-Response Flow: CORS and Error Propagation
- All API handlers set CORS headers and handle OPTIONS preflight
- Errors are returned as JSON with status and message fields
- StaticFileHandler returns appropriate HTTP status codes (302, 403, 404)

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Method{"Method?"}
Method --> |OPTIONS| Preflight["Set CORS headers<br/>204 No Content"]
Method --> |GET/POST/DELETE| Handler["Dispatch to Handler"]
Handler --> Auth{"Requires Auth?"}
Auth --> |Yes| CheckCookie["Check session cookie"]
CheckCookie --> |Unauthorized| Unauthorized["401 JSON error"]
CheckCookie --> |Authorized| Proceed["Proceed to DB operation"]
Auth --> |No| Proceed
Proceed --> DB["Execute SQL"]
DB --> OK{"Success?"}
OK --> |Yes| Respond["200/201 JSON success"]
OK --> |No| Err["500 JSON error"]
Handler --> |Method Not Allowed| MNA["405 JSON error"]
Method --> |Other| MNA
```

**Diagram sources**
- [Server.java:398-411](file://Server.java#L398-L411)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)
- [Server.java:804-904](file://Server.java#L804-L904)

**Section sources**
- [Server.java:398-411](file://Server.java#L398-L411)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)
- [Server.java:804-904](file://Server.java#L804-L904)

## Dependency Analysis
- StaticFileHandler depends on filesystem and authentication gating for admin routes
- All API handlers depend on SQLite connectivity and share common utilities for CORS, response formatting, and JSON parsing/escaping
- Frontend pages depend on handlers for data and actions

```mermaid
graph LR
StaticFileHandler --> FileSystem["Local Filesystem"]
StaticFileHandler --> Auth["isAuthenticated()"]
LoginHandler --> SQLite["portfolio.db"]
ContactHandler --> SQLite
BookingSubmitHandler --> SQLite
MessagesHandler --> SQLite
BookingsHandler --> SQLite
SettingsHandler --> SQLite
ProjectsCrudHandler --> SQLite
EducationCrudHandler --> SQLite
ExperienceCrudHandler --> SQLite
main_js["main.js"] --> LoginHandler
main_js --> ContactHandler
login_html["login.html"] --> LoginHandler
contact_html["contact.html"] --> ContactHandler
admin_html["admin.html"] --> SettingsHandler
admin_html --> MessagesHandler
admin_html --> BookingsHandler
admin_html --> ProjectsCrudHandler
admin_html --> EducationCrudHandler
admin_html --> ExperienceCrudHandler
```

**Diagram sources**
- [Server.java:804-904](file://Server.java#L804-L904)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:354-396](file://Server.java#L354-L396)
- [Server.java:494-554](file://Server.java#L494-L554)
- [Server.java:738-800](file://Server.java#L738-L800)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)
- [main.js:76-136](file://main.js#L76-L136)
- [login.html:146-171](file://login.html#L146-L171)
- [contact.html:143-150](file://contact.html#L143-L150)
- [admin.html:1188-1254](file://admin.html#L1188-L1254)

**Section sources**
- [Server.java:804-904](file://Server.java#L804-L904)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:354-396](file://Server.java#L354-L396)
- [Server.java:494-554](file://Server.java#L494-L554)
- [Server.java:738-800](file://Server.java#L738-L800)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)
- [main.js:76-136](file://main.js#L76-L136)
- [login.html:146-171](file://login.html#L146-L171)
- [contact.html:143-150](file://contact.html#L143-L150)
- [admin.html:1188-1254](file://admin.html#L1188-L1254)

## Performance Considerations
- Database operations use prepared statements to avoid SQL injection and improve performance
- JSON serialization uses manual concatenation with escaping; consider a lightweight JSON library for larger payloads
- Static asset serving streams files directly from disk; ensure adequate buffering for large assets
- CORS headers are set per-request; caching headers could reduce overhead for static assets

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized on admin endpoints: Verify session cookie presence and correctness
- 403 Forbidden on static routes: Ensure paths do not attempt directory traversal
- 404 Not Found: Confirm file existence and canonical path resolution
- 405 Method Not Allowed: Check HTTP method used for the endpoint
- 500 Internal Server Error: Inspect server logs for SQL exceptions and malformed JSON

Operational tips:
- Use browser dev tools to inspect network requests and response bodies
- Validate JSON payloads and required fields before posting
- Monitor server logs for SQL errors during CRUD operations

**Section sources**
- [Server.java:826-832](file://Server.java#L826-L832)
- [Server.java:860-878](file://Server.java#L860-L878)
- [Server.java:556-644](file://Server.java#L556-L644)
- [Server.java:646-736](file://Server.java#L646-L736)
- [Server.java:906-1250](file://Server.java#L906-L1250)
- [Server.java:1252-1377](file://Server.java#L1252-L1377)
- [Server.java:1379-1497](file://Server.java#L1379-L1497)
- [Server.java:1500-1599](file://Server.java#L1500-L1599)

## Conclusion
The Premium Portfolio system employs a straightforward handler-based architecture with clear separation between static asset serving, authentication, and API operations. Session cookies enforce admin access, CORS enables cross-origin requests, and consistent JSON responses simplify frontend integration. The design supports incremental enhancements such as structured logging, input validation libraries, and improved JSON serialization.