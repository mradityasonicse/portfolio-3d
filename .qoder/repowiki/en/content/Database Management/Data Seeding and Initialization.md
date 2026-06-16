# Data Seeding and Initialization

<cite>
**Referenced Files in This Document**
- [Server.java](file://Server.java)
- [server/index.js](file://server/index.js)
- [server/db/connection.js](file://server/db/connection.js)
- [server/db/schema.js](file://server/db/schema.js)
- [main.js](file://main.js)
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
This document explains the database initialization and data seeding procedures for the portfolio application. It covers:
- Automatic database creation during server startup
- Table creation with constraints and default values
- Seeding logic for portfolio_settings, projects, education, and experience
- Migration system for adding new columns to existing databases
- Authentication setup with hardcoded credentials and session management
- Troubleshooting guidance for initialization failures and database corruption

## Project Structure
The project includes both a Java-based server and a Node.js server. The database initialization and seeding logic is implemented in two places:
- Java server: creates SQLite tables and seeds default data
- Node.js server: initializes SQLite with additional tables and seeds default data, plus manages authentication and session storage

```mermaid
graph TB
subgraph "Java Server"
JMain["Server.java<br/>Startup + DB Init"]
JTables["Contacts, Bookings, Portfolio Settings,<br/>Projects, Education, Experience"]
end
subgraph "Node.js Server"
NMain["server/index.js<br/>Express App + DB Init"]
NConn["server/db/connection.js<br/>SQLite Connection"]
NSchema["server/db/schema.js<br/>Schema + Seeding + Migrations"]
NAuth["Authentication & Sessions"]
end
subgraph "Client"
Browser["Browser<br/>main.js"]
end
JMain --> JTables
NMain --> NConn
NMain --> NSchema
NSchema --> NAuth
Browser --> |"HTTP API"| NMain
Browser --> |"HTTP API"| JMain
```

**Diagram sources**
- [Server.java:34-83](file://Server.java#L34-L83)
- [server/index.js:25-26](file://server/index.js#L25-L26)
- [server/db/connection.js:1-25](file://server/db/connection.js#L1-L25)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [main.js:77-136](file://main.js#L77-L136)

**Section sources**
- [Server.java:34-83](file://Server.java#L34-L83)
- [server/index.js:25-26](file://server/index.js#L25-L26)
- [server/db/connection.js:1-25](file://server/db/connection.js#L1-L25)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [main.js:77-136](file://main.js#L77-L136)

## Core Components
- Java server initialization: Creates SQLite tables and seeds default data for portfolio_settings, projects, education, and experience. Includes a migration loop to add new columns to existing databases.
- Node.js server initialization: Initializes SQLite with additional admin-related tables, seeds default data, and sets up authentication and session management.
- Client-side integration: The frontend fetches settings and renders dynamic content, relying on the backend APIs.

Key responsibilities:
- Database creation and migrations
- Default data seeding
- Authentication and session handling
- Frontend-backend integration

**Section sources**
- [Server.java:85-337](file://Server.java#L85-L337)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [server/index.js:25-26](file://server/index.js#L25-L26)

## Architecture Overview
The system initializes the database at startup and exposes REST endpoints for data management. The Node.js server also manages authentication and session persistence.

```mermaid
sequenceDiagram
participant Client as "Browser"
participant NodeApp as "server/index.js"
participant Schema as "server/db/schema.js"
participant Conn as "server/db/connection.js"
participant Java as "Server.java"
Client->>NodeApp : "GET /api/settings"
NodeApp->>Schema : "initializeDatabase()"
Schema->>Conn : "getDb()"
Schema->>Schema : "CREATE TABLES + SEED DEFAULTS"
Schema-->>NodeApp : "Initialization complete"
NodeApp-->>Client : "JSON settings"
Client->>Java : "GET /api/settings"
Java->>Java : "Initialize SQLite + Create Tables"
Java-->>Client : "JSON settings"
```

**Diagram sources**
- [server/index.js:25-26](file://server/index.js#L25-L26)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)
- [Server.java:85-337](file://Server.java#L85-L337)

## Detailed Component Analysis

### Java Server Database Initialization
The Java server performs the following steps at startup:
- Loads the SQLite JDBC driver
- Establishes a connection to the SQLite database
- Creates tables if they do not exist:
  - contacts
  - bookings
  - portfolio_settings (with strict constraints and extensive defaults)
  - projects
  - education
  - experience
- Runs a migration loop to add new columns to the portfolio_settings table if missing
- Seeds default data if tables are empty

```mermaid
flowchart TD
Start(["Server.main()"]) --> LoadDriver["Load SQLite JDBC Driver"]
LoadDriver --> ConnectDB["Connect to SQLite"]
ConnectDB --> CreateContacts["Create 'contacts' table"]
CreateContacts --> CreateBookings["Create 'bookings' table"]
CreateBookings --> CreatePortfolioSettings["Create 'portfolio_settings' table<br/>+ Constraints + Defaults"]
CreatePortfolioSettings --> MigrateCols["Add missing columns to 'portfolio_settings'"]
MigrateCols --> SeedSettings["Seed 'portfolio_settings' if empty"]
SeedSettings --> CreateProjects["Create 'projects' table"]
CreateProjects --> SeedProjects["Seed 'projects' if empty"]
CreateProjects --> CreateEducation["Create 'education' table"]
CreateEducation --> SeedEducation["Seed 'education' if empty"]
CreateEducation --> CreateExperience["Create 'experience' table"]
CreateExperience --> SeedExperience["Seed 'experience' if empty"]
SeedExperience --> End(["Ready"])
```

**Diagram sources**
- [Server.java:85-337](file://Server.java#L85-L337)

**Section sources**
- [Server.java:85-337](file://Server.java#L85-L337)

### Node.js Server Database Initialization
The Node.js server initializes the database using a separate module:
- Ensures the SQLite connection is established with journal mode WAL and foreign keys enabled
- Creates tables including contacts, bookings, portfolio_settings, projects, education, experience, and additional admin tables (users, sessions, sections, pages, media, api_keys, activity_logs, backups, analytics_events, component_templates)
- Seeds default data for portfolio_settings, projects, education, experience, and a default admin user
- Starts the Express server and exposes API routes

```mermaid
flowchart TD
Start(["server/index.js"]) --> InitDB["initializeDatabase()"]
InitDB --> CreateCore["Create core tables:<br/>contacts, bookings, portfolio_settings,<br/>projects, education, experience"]
CreateCore --> CreateAdmin["Create admin tables:<br/>users, sessions, sections, pages,<br/>media, api_keys, activity_logs,<br/>backups, analytics_events, component_templates"]
CreateAdmin --> SeedDefaults["Seed defaults:<br/>portfolio_settings, projects, education, experience,<br/>default admin user"]
SeedDefaults --> StartServer["Start Express server"]
StartServer --> Ready(["API ready"])
```

**Diagram sources**
- [server/index.js:25-26](file://server/index.js#L25-L26)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)

**Section sources**
- [server/index.js:25-26](file://server/index.js#L25-L26)
- [server/db/schema.js:4-286](file://server/db/schema.js#L4-L286)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)

### Authentication Setup and Session Management
The system supports two authentication approaches:
- Hardcoded credentials for the legacy Java login endpoint
- Default admin user with hashed password for the Node.js admin panel

```mermaid
sequenceDiagram
participant Client as "Browser"
participant Java as "Server.java LoginHandler"
participant Node as "server/db/schema.js"
participant DB as "SQLite"
Client->>Java : "POST /api/login {username, password}"
Java->>Java : "Validate hardcoded credentials"
Java-->>Client : "Set HttpOnly session cookie"
Client->>Node : "POST /api/auth/register {email, password}"
Node->>DB : "Insert user with hashed password"
Node-->>Client : "Registration success"
```

**Diagram sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [server/db/schema.js:273-281](file://server/db/schema.js#L273-L281)

**Section sources**
- [Server.java:355-396](file://Server.java#L355-L396)
- [server/db/schema.js:273-281](file://server/db/schema.js#L273-L281)

### Data Seeding Logic
Default data seeding ensures the application displays meaningful content out-of-the-box:
- portfolio_settings: Single-row table with a primary key constraint and numerous default fields for theme, SEO, branding, and content
- projects: Example portfolio project with metadata and visibility flags
- education: Academic history with multiple entries
- experience: Professional and learning background entries
- Additional admin tables: Users, sessions, sections, pages, media, API keys, activity logs, backups, analytics events, and component templates

```mermaid
flowchart TD
SeedStart["Seed Check"] --> CheckSettings["COUNT portfolio_settings"]
CheckSettings --> |0| SeedSettings["INSERT default id=1"]
CheckSettings --> |>0| SkipSettings["Skip"]
SeedSettings --> CheckProjects["COUNT projects"]
CheckProjects --> |0| SeedProjects["INSERT example project"]
CheckProjects --> |>0| SkipProjects["Skip"]
SeedProjects --> CheckEducation["COUNT education"]
CheckEducation --> |0| SeedEducation["INSERT academic history"]
CheckEducation --> |>0| SkipEducation["Skip"]
SeedEducation --> CheckExperience["COUNT experience"]
CheckExperience --> |0| SeedExperience["INSERT professional background"]
CheckExperience --> |>0| SkipExperience["Skip"]
SkipExperience --> Done["Seeding Complete"]
```

**Diagram sources**
- [Server.java:216-331](file://Server.java#L216-L331)
- [server/db/schema.js:222-281](file://server/db/schema.js#L222-L281)

**Section sources**
- [Server.java:216-331](file://Server.java#L216-L331)
- [server/db/schema.js:222-281](file://server/db/schema.js#L222-L281)

### Migration System
The Java server includes a migration system that:
- Iterates through a predefined list of new columns for portfolio_settings
- Attempts to add each column with its default value
- Ignores errors if the column already exists, ensuring backward compatibility

```mermaid
flowchart TD
MStart["Migration Loop"] --> ForEachCol["For each new column definition"]
ForEachCol --> TryAdd["ALTER TABLE ... ADD COLUMN"]
TryAdd --> Exists{"Column exists?"}
Exists --> |Yes| Ignore["Ignore error and continue"]
Exists --> |No| Success["Column added"]
Success --> Next["Next column"]
Ignore --> Next
Next --> MEnd["Migration Complete"]
```

**Diagram sources**
- [Server.java:173-214](file://Server.java#L173-L214)

**Section sources**
- [Server.java:173-214](file://Server.java#L173-L214)

### Frontend Integration
The client-side script fetches settings and renders dynamic content:
- Retrieves settings from the backend
- Applies dynamic theme, fonts, and content
- Renders projects, education, and experience lists
- Provides fallback rendering if the backend is unavailable

```mermaid
sequenceDiagram
participant Browser as "main.js"
participant Backend as "API"
Browser->>Backend : "GET /api/settings"
Backend-->>Browser : "JSON settings"
Browser->>Browser : "applyDynamicTheme(), applySectionOrder(), applyDynamicContent()"
Browser->>Backend : "GET /api/projects, /api/education, /api/experience"
Backend-->>Browser : "JSON data"
Browser->>Browser : "renderProjects(), renderEducation(), renderExperience()"
```

**Diagram sources**
- [main.js:77-136](file://main.js#L77-L136)
- [main.js:1193-1381](file://main.js#L1193-L1381)

**Section sources**
- [main.js:77-136](file://main.js#L77-L136)
- [main.js:1193-1381](file://main.js#L1193-L1381)

## Dependency Analysis
The initialization process depends on:
- SQLite JDBC driver (Java)
- Better-sqlite3 library (Node.js)
- Express framework (Node.js)
- Frontend scripts (main.js)

```mermaid
graph TB
Java["Server.java"] --> SQLite["SQLite Database"]
Node["server/index.js"] --> Express["Express"]
Node --> BetterSQLite["better-sqlite3"]
Node --> Schema["server/db/schema.js"]
Schema --> BetterSQLite
Browser["main.js"] --> Node
Browser --> Java
```

**Diagram sources**
- [Server.java:85-92](file://Server.java#L85-L92)
- [server/index.js:1-10](file://server/index.js#L1-L10)
- [server/db/connection.js:1-2](file://server/db/connection.js#L1-L2)
- [main.js:77-136](file://main.js#L77-L136)

**Section sources**
- [Server.java:85-92](file://Server.java#L85-L92)
- [server/index.js:1-10](file://server/index.js#L1-L10)
- [server/db/connection.js:1-2](file://server/db/connection.js#L1-L2)
- [main.js:77-136](file://main.js#L77-L136)

## Performance Considerations
- SQLite is lightweight and suitable for small-scale deployments
- WAL mode improves concurrent read performance
- Prepared statements and parameterized queries reduce overhead
- Default data seeding runs only when tables are empty, minimizing unnecessary writes

## Troubleshooting Guide
Common issues and resolutions:
- Database initialization fails
  - Verify SQLite JDBC driver is available (Java) or better-sqlite3 is installed (Node.js)
  - Check file permissions for the database file location
  - Review server logs for specific SQL errors
- Port conflicts
  - Set the PORT environment variable to a free port
- Authentication failures
  - Java login requires hardcoded credentials
  - Node.js admin registration creates a default admin user with a hashed password
- Database corruption
  - Back up the database file before attempting repairs
  - Recreate tables and re-seed defaults if necessary
  - Use SQLite pragma commands to check integrity

**Section sources**
- [Server.java:85-92](file://Server.java#L85-L92)
- [server/db/connection.js:8-15](file://server/db/connection.js#L8-L15)
- [server/db/schema.js:273-281](file://server/db/schema.js#L273-L281)

## Conclusion
The portfolio application initializes its database automatically at startup, creates all necessary tables with appropriate constraints and defaults, and seeds default content for immediate usability. The Java server focuses on core portfolio data and migrations, while the Node.js server extends the schema for administrative features and includes robust authentication and session management. The frontend integrates seamlessly with both backend APIs to render dynamic content.