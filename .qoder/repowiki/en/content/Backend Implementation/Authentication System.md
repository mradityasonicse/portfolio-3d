# Authentication System

<cite>
**Referenced Files in This Document**
- [Server.java](file://Server.java)
- [login.html](file://login.html)
- [design.md](file://design.md)
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
This document explains the authentication system used by the portfolio backend. It focuses on the session-based authentication mechanism, cookie management, and security implementation. It documents the LoginHandler class, the authentication flow, session cookie creation and validation, authentication middleware for protected routes, and unauthorized access handling. It also covers security considerations, cookie attributes, potential vulnerabilities, authentication state management, and logout procedures.

## Project Structure
The authentication system is implemented in a single Java server file that exposes several HTTP endpoints and serves static pages. The relevant parts include:
- A LoginHandler that accepts credentials and sets a session cookie
- An isAuthenticated helper that validates the session cookie
- Protected endpoints that check authentication before processing requests
- A static file server that enforces authentication for admin resources

```mermaid
graph TB
Client["Browser"]
Server["Server.java"]
LoginHandler["LoginHandler<br/>POST /api/login"]
StaticHandler["StaticFileHandler<br/>/admin, /admin.html, /"]
ProtectedAPI["Protected Handlers<br/>/api/messages, /api/bookings, /api/settings"]
Client --> LoginHandler
Client --> StaticHandler
Client --> ProtectedAPI
LoginHandler --> Server
StaticHandler --> Server
ProtectedAPI --> Server
```

**Diagram sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [Server.java:805-890](file://Server.java#L805-L890)
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:647-736](file://Server.java#L647-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)

**Section sources**
- [Server.java:34-83](file://Server.java#L34-L83)
- [Server.java:805-890](file://Server.java#L805-L890)

## Core Components
- LoginHandler: Validates credentials and sets a session cookie when successful.
- isAuthenticated: Reads the Cookie header and checks for a matching session cookie value.
- Protected endpoints: Require a valid session cookie before allowing access.
- StaticFileHandler: Enforces authentication for admin pages.

Key implementation references:
- LoginHandler and cookie setting: [Server.java:355-396](file://Server.java#L355-L396)
- Session validation: [Server.java:339-352](file://Server.java#L339-L352)
- Protected API handlers: [Server.java:557-644](file://Server.java#L557-L644), [Server.java:647-736](file://Server.java#L647-L736), [Server.java:907-1250](file://Server.java#L907-L1250)
- Admin page authentication enforcement: [Server.java:826-832](file://Server.java#L826-L832)

**Section sources**
- [Server.java:339-396](file://Server.java#L339-L396)
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:647-736](file://Server.java#L647-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)
- [Server.java:826-832](file://Server.java#L826-L832)

## Architecture Overview
The authentication flow is session-based:
- The client submits credentials to the login endpoint.
- On success, the server responds with a Set-Cookie header that includes a session cookie.
- Subsequent requests carry the session cookie in the Cookie header.
- Protected endpoints and admin pages validate the presence and value of the session cookie.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Login as "LoginHandler"
participant Server as "Server.java"
participant Protected as "Protected Handler"
participant Static as "StaticFileHandler"
Client->>Login : POST /api/login {username,password}
Login->>Server : Validate credentials
Server-->>Login : Success or Failure
alt Success
Login-->>Client : 200 OK + Set-Cookie : session_id=...
else Failure
Login-->>Client : 401 Unauthorized
end
Client->>Protected : GET /api/messages (with Cookie)
Protected->>Server : isAuthenticated(Cookie)
Server-->>Protected : Authorized or Not
alt Authorized
Protected-->>Client : 200 OK
else Not Authorized
Protected-->>Client : 401 Unauthorized
end
Client->>Static : GET /admin.html (with Cookie)
Static->>Server : isAuthenticated(Cookie)
Server-->>Static : Authorized or Not
alt Authorized
Static-->>Client : 200 OK
else Not Authorized
Static-->>Client : 302 Found -> /login.html
end
```

**Diagram sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:826-832](file://Server.java#L826-L832)

## Detailed Component Analysis

### LoginHandler
The LoginHandler processes POST requests to the login endpoint:
- Validates the HTTP method and CORS preflight handling
- Parses the request body to extract username and password
- Compares credentials against hard-coded values
- On success, sets a session cookie with HttpOnly and SameSite attributes
- On failure, returns an error response

```mermaid
flowchart TD
Start(["LoginHandler.handle"]) --> CheckMethod["Check method is POST"]
CheckMethod --> |Not POST| Respond405["Respond 405 Method Not Allowed"]
CheckMethod --> |POST| ParseBody["Parse request body"]
ParseBody --> ExtractCreds["Extract username and password"]
ExtractCreds --> ValidateCreds{"Credentials match?"}
ValidateCreds --> |Yes| SetCookie["Add Set-Cookie: session_id=...; HttpOnly; SameSite=Lax"]
SetCookie --> Respond200["Respond 200 OK"]
ValidateCreds --> |No| Respond401["Respond 401 Unauthorized"]
Respond405 --> End(["Exit"])
Respond200 --> End
Respond401 --> End
```

**Diagram sources**
- [Server.java:355-396](file://Server.java#L355-L396)

**Section sources**
- [Server.java:355-396](file://Server.java#L355-L396)

### Session Validation
The isAuthenticated helper reads the Cookie header and checks for a specific session cookie:
- Splits the Cookie header by semicolon
- Iterates through cookies to find session_id
- Compares the value to an expected authorized value

```mermaid
flowchart TD
Start(["isAuthenticated(exchange)"]) --> GetCookie["Get Cookie header"]
GetCookie --> HasCookie{"Cookie present?"}
HasCookie --> |No| ReturnFalse["Return false"]
HasCookie --> |Yes| SplitCookies["Split by ';'"]
SplitCookies --> ForEachCookie["For each cookie"]
ForEachCookie --> SplitKV["Split by '='"]
SplitKV --> IsSessionId{"Key equals 'session_id'?"}
IsSessionId --> |No| NextCookie["Next cookie"]
IsSessionId --> |Yes| CompareValue{"Value equals expected?"}
CompareValue --> |Yes| ReturnTrue["Return true"]
CompareValue --> |No| NextCookie
NextCookie --> ForEachCookie
ReturnFalse --> End(["Exit"])
ReturnTrue --> End
```

**Diagram sources**
- [Server.java:339-352](file://Server.java#L339-L352)

**Section sources**
- [Server.java:339-352](file://Server.java#L339-L352)

### Protected Routes and Middleware
Protected endpoints and admin pages rely on the isAuthenticated helper:
- MessagesHandler and BookingsHandler check authentication for GET and DELETE
- SettingsHandler checks authentication for POST /api/settings/save
- StaticFileHandler redirects unauthenticated users to the login page for admin.html

```mermaid
sequenceDiagram
participant Client as "Client"
participant Handler as "Protected Handler"
participant Auth as "isAuthenticated"
participant DB as "Database"
Client->>Handler : Request (GET/DELETE/POST)
Handler->>Auth : isAuthenticated(Cookie)
alt Authorized
Auth-->>Handler : true
Handler->>DB : Perform operation
DB-->>Handler : Result
Handler-->>Client : 200 OK
else Not Authorized
Auth-->>Handler : false
Handler-->>Client : 401 Unauthorized
end
```

**Diagram sources**
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:647-736](file://Server.java#L647-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)
- [Server.java:339-352](file://Server.java#L339-L352)

**Section sources**
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:647-736](file://Server.java#L647-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)
- [Server.java:826-832](file://Server.java#L826-L832)

### Frontend Login Flow
The login page sends credentials to the backend and handles responses:
- Collects username and password from the form
- Sends a POST request to the login endpoint
- On success, redirects to the admin page

```mermaid
sequenceDiagram
participant Client as "login.html"
participant Server as "LoginHandler"
participant Browser as "Browser"
Client->>Server : POST /api/login {username,password}
Server-->>Client : 200 OK + Set-Cookie or 401 Unauthorized
alt Success
Client->>Browser : Redirect to /admin
else Failure
Client->>Client : Show error message
end
```

**Diagram sources**
- [login.html:146-171](file://login.html#L146-L171)
- [Server.java:355-396](file://Server.java#L355-L396)

**Section sources**
- [login.html:146-171](file://login.html#L146-L171)

## Dependency Analysis
- LoginHandler depends on the request method and body parsing to validate credentials.
- isAuthenticated depends on the Cookie header and a fixed expected session value.
- Protected handlers depend on isAuthenticated to gate access.
- StaticFileHandler depends on isAuthenticated to enforce admin access.

```mermaid
graph TB
LoginHandler["LoginHandler"]
isAuthenticated["isAuthenticated"]
MessagesHandler["MessagesHandler"]
BookingsHandler["BookingsHandler"]
SettingsHandler["SettingsHandler"]
StaticFileHandler["StaticFileHandler"]
LoginHandler --> isAuthenticated
MessagesHandler --> isAuthenticated
BookingsHandler --> isAuthenticated
SettingsHandler --> isAuthenticated
StaticFileHandler --> isAuthenticated
```

**Diagram sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:647-736](file://Server.java#L647-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)
- [Server.java:805-890](file://Server.java#L805-L890)

**Section sources**
- [Server.java:339-396](file://Server.java#L339-L396)
- [Server.java:557-736](file://Server.java#L557-L736)
- [Server.java:907-1250](file://Server.java#L907-L1250)
- [Server.java:805-890](file://Server.java#L805-L890)

## Performance Considerations
- Authentication checks are lightweight string comparisons and header parsing.
- Cookies are small and validated quickly.
- Protected endpoints perform database operations after authentication; ensure database queries are efficient and use prepared statements as implemented.

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized on login
  - Ensure the request method is POST and the body contains username and password fields.
  - Verify the credentials match the expected values.
  - Check that the browser accepts the Set-Cookie response.
  - Reference: [Server.java:355-396](file://Server.java#L355-L396)

- 401 Unauthorized on protected endpoints
  - Confirm the session cookie is present in the Cookie header.
  - Verify the cookie value matches the expected authorized value.
  - Reference: [Server.java:339-352](file://Server.java#L339-L352), [Server.java:557-644](file://Server.java#L557-L644)

- 302 redirect to login for admin page
  - Unauthenticated requests to admin pages are redirected to the login page.
  - Reference: [Server.java:826-832](file://Server.java#L826-L832)

- CORS errors
  - Ensure the server sets appropriate CORS headers for preflight and actual requests.
  - Reference: [Server.java:398-402](file://Server.java#L398-L402)

**Section sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [Server.java:339-352](file://Server.java#L339-L352)
- [Server.java:557-644](file://Server.java#L557-L644)
- [Server.java:826-832](file://Server.java#L826-L832)
- [Server.java:398-402](file://Server.java#L398-L402)

## Conclusion
The authentication system uses a straightforward session-based approach with a single session cookie. LoginHandler validates credentials and sets a cookie with HttpOnly and SameSite attributes. isAuthenticated performs a simple check on incoming requests to gate protected endpoints and admin pages. While functional, the implementation uses hardcoded credentials and a simple cookie value, which introduces security risks that should be addressed in production environments.