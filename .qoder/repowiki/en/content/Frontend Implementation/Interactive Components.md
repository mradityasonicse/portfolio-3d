# Interactive Components

<cite>
**Referenced Files in This Document**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)
- [style.css](file://style.css)
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
This document focuses on the interactive components of the portfolio website, covering form handling (contact and booking), tabbed interfaces, mobile navigation, dynamic content loading, and project preview systems. It also explains how frontend JavaScript integrates with backend API endpoints and outlines accessibility features and keyboard navigation support.

## Project Structure
The interactive behavior is primarily implemented in a single JavaScript module that initializes loaders, animations, navigation, forms, and dynamic content rendering. HTML pages define the markup and structure for each section, while CSS provides styling and transitions. The backend is a Java HTTP server exposing REST endpoints for forms, admin, and dynamic content.

```mermaid
graph TB
subgraph "Frontend"
JS["main.js"]
HTML1["index.html"]
HTML2["contact.html"]
HTML3["projects.html"]
CSS["style.css"]
end
subgraph "Backend"
JAVA["Server.java"]
DB["SQLite: portfolio.db"]
end
HTML1 --> JS
HTML2 --> JS
HTML3 --> JS
JS --> JAVA
JAVA --> DB
JS --> CSS
```

**Diagram sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)
- [style.css](file://style.css)
- [Server.java](file://Server.java)

**Section sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)
- [style.css](file://style.css)
- [Server.java](file://Server.java)

## Core Components
- Page loader and initialization sequence
- Mobile navigation toggle and backdrop behavior
- Tabbed interface for switching between contact and booking forms
- Contact form submission with validation and feedback
- Booking form submission with validation and feedback
- Dynamic content rendering from backend settings and database
- Project preview system with mouse tracking and hover effects
- Magnetic navigation and interactive cards
- Scroll-triggered animations via GSAP

**Section sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)
- [style.css](file://style.css)

## Architecture Overview
The frontend initializes by fetching settings and dynamic content from the backend, then renders lists and applies themes. Forms submit to backend endpoints, which persist data to SQLite and optionally notify via external services. Animations and interactions are coordinated through centralized initialization functions.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant Frontend as "main.js"
participant Backend as "Server.java"
participant SQLite as "portfolio.db"
Browser->>Frontend : DOMContentLoaded
Frontend->>Backend : GET /api/settings
Backend-->>Frontend : {settings, projects, education, experience}
Frontend->>Frontend : applyDynamicTheme(), renderProjects(), renderEducation(), renderExperience()
Frontend->>Frontend : initFormTabs(), initContactForm(), initBookingForm()
Browser->>Frontend : Submit Contact Form
Frontend->>Backend : POST /api/contact {name,email,message}
Backend->>SQLite : INSERT INTO contacts
Backend-->>Frontend : {status,message}
Browser->>Frontend : Submit Booking Form
Frontend->>Backend : POST /api/booking-submit {name,email,date,time,topic}
Backend->>SQLite : INSERT INTO bookings
Backend-->>Frontend : {status,message}
```

**Diagram sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

**Section sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

## Detailed Component Analysis

### Form Handling System
- Tabbed interface switching between “Send Message” and “Book a Call”
- Contact form validation and submission to backend endpoint
- Booking form validation and submission to backend endpoint
- Visual feedback during submission (buttons, spinners, status messages)
- Optional external email notifications via third-party service

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Tabbed Forms"
participant JS as "initFormTabs()"
participant Contact as "initContactForm()"
participant Booking as "initBookingForm()"
participant BE as "Server.java"
participant DB as "SQLite"
User->>UI : Click "Book a Call"
UI->>JS : Switch active tab
JS-->>UI : Animate form swap
User->>Contact : Submit message form
Contact->>BE : POST /api/contact
BE->>DB : INSERT INTO contacts
BE-->>Contact : JSON {status,message}
Contact-->>User : Show success/error status
User->>Booking : Submit booking form
Booking->>BE : POST /api/booking-submit
BE->>DB : INSERT INTO bookings
BE-->>Booking : JSON {status,message}
Booking-->>User : Show success/error status
```

**Diagram sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [Server.java](file://Server.java)

Implementation highlights:
- Tab switching uses GSAP for smooth transitions and toggles active classes.
- Forms prevent concurrent submissions and disable controls during requests.
- Status messages are styled and animated for emphasis.
- Submission errors are surfaced with user-friendly messages.

**Section sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [Server.java](file://Server.java)

### Mobile Navigation Implementation
- Toggle button opens/closes a full-screen menu with animated entrance
- Body scroll locking prevents background movement when menu is open
- Links close the menu and reset scroll lock on click

```mermaid
flowchart TD
Start(["Click Menu Toggle"]) --> CheckActive{"Menu Active?"}
CheckActive --> |No| Open["Add 'active' class<br/>Add 'menu-active' to header<br/>Lock body scroll"]
CheckActive --> |Yes| Close["Remove 'active' class<br/>Remove 'menu-active' from header<br/>Unlock body scroll"]
Close --> End(["Done"])
Open --> End
```

**Diagram sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)

**Section sources**
- [main.js](file://main.js)
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)

### Dynamic Content Loading Mechanisms
- On initialization, frontend fetches settings and dynamic content from backend
- Applies theme tokens and reorders sections
- Renders education, projects, and experience lists
- Updates contact coordinates and skill tags

```mermaid
sequenceDiagram
participant Init as "initAll()"
participant BE as "Server.java"
participant Render as "render*() helpers"
Init->>BE : GET /api/settings
BE-->>Init : {settings, projects, education, experience}
Init->>Render : applyDynamicTheme(settings)
Init->>Render : applySectionOrder(settings.layout_sections_order)
Init->>Render : renderProjects(projects)
Init->>Render : renderEducation(education)
Init->>Render : renderExperience(experience)
```

**Diagram sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

**Section sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

### Project Preview System with Mouse Tracking and Hover Effects
- Project rows trigger a floating preview that follows the mouse
- Preview displays project name and colored background
- Uses requestAnimationFrame for smooth tracking
- Removes preview and cancels animation on mouse leave

```mermaid
flowchart TD
EnterRow["Mouse enter project row"] --> SetName["Set preview text<br/>Set preview background"]
SetName --> Show["Add 'active' class"]
Show --> Track["requestAnimationFrame followMouse()<br/>Update preview position"]
Track --> Move["On move: update preview.style.left/top"]
Leave["Mouse leave row"] --> Hide["Remove 'active' class<br/>cancelAnimationFrame"]
```

**Diagram sources**
- [main.js](file://main.js)
- [projects.html](file://projects.html)

**Section sources**
- [main.js](file://main.js)
- [projects.html](file://projects.html)

### Accessibility and Keyboard Navigation Support
- Focusable elements include buttons, links, and form inputs
- Keyboard focus indicators are visible via default browser styles
- Interactive elements expose semantic roles and labels:
  - Buttons and links are native elements with accessible names
  - Form inputs include associated labels
  - Animated elements rely on reduced-motion-safe fallbacks where applicable

Recommendations:
- Ensure skip links for main content
- Add ARIA attributes for live regions (status updates)
- Provide visible focus rings and avoid hiding focus styles
- Test tab order and ensure logical navigation flow across pages

**Section sources**
- [contact.html](file://contact.html)
- [projects.html](file://projects.html)
- [index.html](file://index.html)

## Dependency Analysis
- Frontend depends on:
  - GSAP for scroll-triggered and micro-interactions
  - Local storage of Web3Forms key for optional email notifications
  - Backend endpoints for settings and form submissions
- Backend exposes:
  - Public endpoints for forms
  - Protected endpoints for admin data retrieval and deletion
  - Authentication via cookie-based session

```mermaid
graph LR
JS["main.js"] --> API1["/api/settings"]
JS --> API2["/api/contact"]
JS --> API3["/api/booking-submit"]
API2 --> DB["SQLite: contacts"]
API3 --> DB2["SQLite: bookings"]
```

**Diagram sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

**Section sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

## Performance Considerations
- Use requestAnimationFrame for smooth mouse-following previews
- Debounce or throttle resize handlers for canvas and grids
- Avoid layout thrashing by batching DOM reads/writes
- Lazy-load heavy assets and defer non-critical scripts
- Minimize reflows by animating transform/opacity instead of layout-affecting properties

## Troubleshooting Guide
Common issues and resolutions:
- Forms fail silently
  - Verify backend is running and reachable
  - Check CORS headers and content-type
  - Inspect browser console for network errors
- Animations not playing
  - Confirm GSAP availability and proper initialization
  - Ensure DOM elements exist before applying ScrollTrigger
- Dynamic content not updating
  - Confirm /api/settings returns expected JSON
  - Check for missing keys in settings payload
- Mobile menu not closing
  - Ensure body scroll unlock occurs on link click
  - Verify active class toggling on toggle click

**Section sources**
- [main.js](file://main.js)
- [Server.java](file://Server.java)

## Conclusion
The interactive components combine robust form handling, dynamic content rendering, and polished UI behaviors. The frontend integrates seamlessly with backend endpoints, while maintaining accessibility and performance best practices. Extending the system involves adding new tabs/forms, expanding backend endpoints, and ensuring consistent user feedback and accessibility.