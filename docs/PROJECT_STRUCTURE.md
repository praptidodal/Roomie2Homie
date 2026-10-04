# Roomie2Homie Project Structure

Roomie2Homie follows a decoupled client-server architecture with a React frontend, Node.js/Express backend, and MongoDB database.

## Root Structure


Roomie2Homie/
├── frontend/                  # React + Vite frontend application
├── backend/                   # Node.js + Express + TypeScript backend
├── docs/                      # Project documentation
├── .gitignore
└── README.md


## Frontend


frontend/
└── src/
    ├── components/            # Reusable UI and layout components
    ├── contexts/              # Global React state and authentication
    ├── data/                  # Frontend data and mock data
    ├── pages/                 # Application pages and screens
    ├── services/              # API communication
    ├── types/                 # TypeScript types and interfaces
    └── utils/                 # Frontend utility functions


The frontend is a React single-page application built with Vite. It handles authentication state, protected routes, user-facing pages, roommate discovery, rooms, chat, notifications, verification, and admin interfaces.

## Backend

backend/
├── uploads/
│   ├── avatars/               # Uploaded profile photos
│   └── rooms/                 # Uploaded room photos
├── src/
│   ├── config/                # Database and environment configuration
│   ├── middlewares/           # Authentication, errors, and file uploads
│   ├── models/                # Mongoose database models
│   ├── routes/                # Express API routes
│   ├── controllers/           # Request handling and business logic
│   ├── services/              # Domain-specific services
│   └── utils/                 # Authentication, compatibility, and DTO utilities
├── package.json
└── .env.example


The backend exposes REST APIs and handles authentication, profiles, rooms, matching, enquiries, chat, notifications, verification, and administration.

## Database

Roomie2Homie uses MongoDB through Mongoose.

Core collections include:

- Users
- Rooms
- Match Requests
- Room Enquiries
- Chat Threads
- Chat Messages
- Notifications
- Verification Requests
- Reports

## Application Flow


React Frontend
      │
      │ HTTP / JSON / Multipart
      ▼
Node.js + Express Backend
      │
      │ Mongoose
      ▼

Authentication uses JWT-based sessions stored in HTTP-only cookies.

## Documentation

The `docs/` directory contains detailed documentation covering:

- Project overview
- System architecture
- Frontend architecture
- Backend architecture
- Database schema
- Authentication and security
- API documentation
- User flows
- Room marketplace
- Matching system
- Chat and notifications
- Verification and administration
- File uploads and media
- UI and responsiveness
- Testing and audit


- `frontend/` — React and Vite application for users and admins.
- `backend/` — Node.js and Express REST API.
- `docs/` — Project planning and documentation.

Planned features: authentication, profiles, lifestyle quiz, roommate matching,
match requests, room listings, chat, verification, notifications and admin tools.
