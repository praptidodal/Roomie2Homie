# Roomie2Homie — Project Structure

> A full-stack roommate discovery and room marketplace application connecting users through profiles, lifestyle compatibility, matching, rooms, chat, verification, and administration.

---

## Architecture Overview

Roomie2Homie follows a **three-tier client-server architecture**:

```text
┌─────────────────────────────────────────────┐
│              PRESENTATION TIER              │
│                                             │
│        React 18 + Vite + TypeScript         │
│                                             │
│  Pages • Components • Contexts • API Client │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / JSON / Multipart
                       │ Cookie-based JWT Session
                       ▼
┌─────────────────────────────────────────────┐
│              APPLICATION TIER               │
│                                             │
│       Node.js + Express + TypeScript        │
│                                             │
│ Routes • Controllers • Middleware • Services│
└──────────────────────┬──────────────────────┘
                       │
                       │ Mongoose ODM
                       ▼
┌─────────────────────────────────────────────┐
│                  DATA TIER                  │
│                                             │
│              MongoDB / Atlas                │
│                                             │
│ Users • Rooms • Matches • Chat • Reports    │
└─────────────────────────────────────────────┘
```

---

## Repository Structure

```text
Roomie2Homie/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── data/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── backend/
│   ├── uploads/
│   │   ├── avatars/
│   │   └── rooms/
│   │
│   └── src/
│       ├── config/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       └── utils/
│
├── docs/
│   └── Project documentation
│
├── .gitignore
└── README.md
```

---

# Frontend

The frontend is a **React 18 Single Page Application** built using Vite and TypeScript.

```text
frontend/
└── src/
    │
    ├── components/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── layout/
    │   ├── roommates/
    │   ├── rooms/
    │   └── ui/
    │
    ├── contexts/
    │   └── AuthContext.tsx
    │
    ├── data/
    │
    ├── pages/
    │   ├── auth/
    │   ├── app/
    │   ├── admin/
    │   └── Landing.tsx
    │
    ├── services/
    │   └── api.ts
    │
    ├── types/
    │   └── index.ts
    │
    └── utils/
        └── format.ts
```

### Frontend Responsibilities

| Area | Responsibility |
|---|---|
| Authentication | Login, registration and session restoration |
| Profiles | User profile and lifestyle information |
| Discovery | Find potential roommates |
| Matching | View and manage roommate matches |
| Rooms | Browse and view room listings |
| Chat | User-to-user communication |
| Notifications | Application alerts |
| Verification | Verification workflow |
| Administration | Admin dashboard and management |

The frontend uses a central API service for communication with the backend and protected routes for authenticated and administrative areas.

---

# Backend

The backend is built with **Node.js, Express and TypeScript** and follows a layered architecture.

```text
backend/
│
├── uploads/
│   ├── avatars/
│   └── rooms/
│
└── src/
    │
    ├── config/
    │   ├── database.ts
    │   └── environment.ts
    │
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   └── upload.middleware.ts
    │
    ├── models/
    │   ├── User.ts
    │   ├── Room.ts
    │   ├── MatchRequest.ts
    │   ├── RoomEnquiry.ts
    │   ├── ChatThread.ts
    │   ├── ChatMessage.ts
    │   ├── Notification.ts
    │   ├── VerificationRequest.ts
    │   └── Report.ts
    │
    ├── routes/
    │   ├── auth.route.ts
    │   ├── users.route.ts
    │   ├── rooms.route.ts
    │   ├── matches.route.ts
    │   ├── enquiries.route.ts
    │   ├── chat.route.ts
    │   ├── notifications.route.ts
    │   ├── verification.route.ts
    │   └── admin.route.ts
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── users.controller.ts
    │   ├── rooms.controller.ts
    │   ├── matches.controller.ts
    │   ├── enquiries.controller.ts
    │   ├── chat.controller.ts
    │   ├── notifications.controller.ts
    │   ├── verification.controller.ts
    │   └── admin.controller.ts
    │
    ├── services/
    │   ├── notification.service.ts
    │   └── verification.service.ts
    │
    └── utils/
        ├── auth.ts
        ├── compatibility.ts
        └── dto.ts
```

---

# Backend Layers

### Routes

Define the REST API endpoints and connect requests to the appropriate controllers.

### Middleware

Handles cross-cutting concerns such as:

- JWT authentication
- Admin authorization
- Error handling
- File uploads
- CORS
- Request parsing

### Controllers

Handle incoming requests and enforce application-level business rules for:

- Authentication
- Users
- Rooms
- Matches
- Enquiries
- Chat
- Notifications
- Verification
- Administration

### Services

Contain reusable domain-specific operations such as:

- Notification creation
- Verification processing and encryption

### Models

Define the MongoDB data structures using Mongoose.

### Utilities

Provide reusable functionality including:

- JWT and password handling
- Compatibility calculation
- DTO transformation and sanitization

---

# Database

Roomie2Homie uses **MongoDB** with **Mongoose**.

### Main Data Models

```text
User
Room
MatchRequest
RoomEnquiry
ChatThread
ChatMessage
Notification
VerificationRequest
Report
```

These models support the application's core functionality including users, rooms, matching, communication, notifications, verification and reporting.

---

# Authentication & Security

Authentication uses **JWT-based sessions stored in HTTP-only cookies**.

```text
Register / Login
       │
       ▼
Backend creates JWT
       │
       ▼
HTTP-only auth cookie
       │
       ▼
Authenticated API requests
       │
       ▼
authenticate middleware
       │
       ▼
Protected controller
```

Administrative endpoints additionally use role-based authorization.

The architecture also includes:

- CORS configuration
- HTTP-only cookies
- `SameSite` protection
- Secure cookies in production
- Password hashing
- JWT verification
- Protected routes
- Admin authorization
- DTO-based response sanitization

---

# Application Request Flow

Every backend request follows a consistent pipeline:

```text
Client Request
      │
      ▼
Express Middleware
      │
      ├── CORS
      ├── Cookie Parsing
      ├── Request Parsing
      └── Authentication
      │
      ▼
API Route
      │
      ▼
Controller
      │
      ▼
Business Logic
      │
      ▼
Mongoose Model
      │
      ▼
MongoDB
      │
      ▼
DTO Sanitization
      │
      ▼
JSON Response
      │
      ▼
React Frontend
```

---

# Core Features

```text
┌────────────────────────────────────────────┐
│              Roomie2Homie                  │
├────────────────────────────────────────────┤
│ Authentication & User Profiles             │
│ Lifestyle Quiz                             │
│ Roommate Discovery                         │
│ Compatibility Matching                     │
│ Room Marketplace                           │
│ Room Enquiries                             │
│ Chat & Messaging                           │
│ Notifications                              │
│ Identity Verification                      │
│ Reports & Moderation                       │
│ Admin Dashboard                            │
└────────────────────────────────────────────┘
```

---

# Documentation

The `docs/` directory contains detailed documentation covering:

- Project Overview
- System Architecture
- Frontend Architecture
- Backend Architecture
- Database Schema
- Authentication & Security
- API Documentation
- User Flows
- Room Marketplace
- Matching System
- Chat & Notifications
- Verification & Admin
- File Uploads & Media
- Frontend UI & Responsiveness
- Testing & Audit
- Development Setup
- Deployment
- Git & Project Workflow
- Known Limitations
- Programmer Quick Reference
