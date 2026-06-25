# Virtual Event Management API

A production-style RESTful backend for a virtual event management platform. Users can register, log in, manage events, and register for events — with secure authentication, role-based access control, and email notifications.

Data is stored **in-memory** (no database required). All data resets when the server restarts.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Running Tests](#running-tests)
9. [User Roles](#user-roles)
10. [Authentication Flow](#authentication-flow)
11. [API Endpoints](#api-endpoints)
12. [End-to-End Usage Guide](#end-to-end-usage-guide)
13. [Request & Response Format](#request--response-format)
14. [HTTP Status Codes](#http-status-codes)
15. [Security](#security)
16. [Data Models](#data-models)
17. [Email Configuration](#email-configuration)
18. [Important Notes](#important-notes)

---

## Features

- **User authentication** — registration and login with bcrypt password hashing
- **JWT tokens** — short-lived access tokens + long-lived refresh tokens
- **Role-based access** — `organizer` and `attendee` roles with separate permissions
- **Event management** — full CRUD for organizers (own events only for update/delete)
- **Participant management** — attendees can register, view, and cancel event registrations
- **Email notifications** — async confirmation email sent on successful event registration
- **Security hardening** — Helmet, CORS, rate limiting, input validation, token blacklist on logout
- **Consistent API responses** — uniform success/error JSON across all endpoints
- **Automated tests** — 63 test cases covering auth, events, participants, and security

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT access & refresh tokens |
| nodemailer | Async email notifications |
| helmet | Secure HTTP headers |
| express-rate-limit | Brute-force protection |
| express-validator | Input sanitization & validation |
| cors | Cross-origin request control |
| dotenv | Environment configuration |
| Jest + Supertest | API testing |

---

## Project Structure

```
Virtual_event_management/
├── src/
│   ├── config/
│   │   └── env.js                 # Environment variable loading
│   ├── controllers/
│   │   ├── auth.controller.js     # Auth request handlers
│   │   └── event.controller.js    # Event request handlers
│   ├── data/
│   │   └── store.js               # In-memory users, events, token blacklist
│   ├── middleware/
│   │   ├── auth.js                # JWT access token verification
│   │   ├── authorize.js           # Role-based access control
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── security.js            # Helmet, CORS, rate limiters
│   │   └── validate.js            # express-validator wrapper
│   ├── routes/
│   │   ├── auth.routes.js         # /register, /login, /refresh, /logout
│   │   └── event.routes.js        # /events CRUD & registration
│   ├── services/
│   │   ├── auth.service.js        # Registration, login, refresh, logout
│   │   ├── event.service.js       # Event & participant business logic
│   │   ├── email.service.js       # Nodemailer email sending
│   │   └── token.service.js       # JWT generation, verification, blacklist
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class
│   │   ├── asyncHandler.js        # Async route error wrapper
│   │   ├── parseId.js             # Route param ID validation
│   │   └── response.js            # Standardized success responses
│   ├── validators/
│   │   ├── auth.validator.js      # Auth input validation rules
│   │   └── event.validator.js     # Event input validation rules
│   ├── app.js                     # Express app configuration
│   └── server.js                  # Server entry point
├── tests/
│   ├── app.test.js                # Health, 404, invalid JSON
│   ├── auth.test.js               # Register, login, refresh, logout
│   ├── events.test.js             # Event CRUD & ownership
│   ├── participants.test.js       # Registration & cancellations
│   ├── security.test.js           # Helmet, CORS, JWT, roles
│   ├── helpers.js                 # Shared test utilities
│   └── setup.js                   # Test environment config
├── .env.example                   # Environment variable template
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- (Optional) Gmail account with App Password for real email delivery

---

## Installation & Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/virtual-event-management.git
cd virtual-event-management
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and update the values (see [Environment Variables](#environment-variables) below).

### Step 4 — Start the server

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `JWT_SECRET` | **Yes** | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS allowed origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per IP per window |
| `LOGIN_RATE_LIMIT_MAX` | No | `5` | Max login/register attempts per IP |
| `SMTP_HOST` | No | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP email username |
| `SMTP_PASS` | No | — | SMTP email password / app password |

> **Never commit `.env` to Git.** Only `.env.example` should be in the repository.

---

## Running the Application

```bash
# Development (auto-reload on file changes)
npm run dev

# Production
npm start
```

Verify the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Virtual Event Management API is running."
}
```

---

## Running Tests

```bash
npm test
```

This runs **63 automated tests** across 5 test suites:

| Test File | Coverage |
|-----------|----------|
| `app.test.js` | Health check, 404 routes, invalid JSON |
| `auth.test.js` | Register, login, refresh, logout, token errors |
| `events.test.js` | Event CRUD, ownership, validation |
| `participants.test.js` | Event registration, cancel, my registrations |
| `security.test.js` | Helmet, CORS, JWT blacklist, role authorization |

---

## Postman API Testing

Import these files from the `postman/` folder into [Postman](https://www.postman.com/downloads/):

- `postman/Virtual-Event-Management.postman_collection.json`
- `postman/Virtual-Event-Management.postman_environment.json`

See [postman/README.md](postman/README.md) for import steps and recommended test order.

Tokens (`accessToken`, `refreshToken`) and `eventId` are **saved automatically** after Login and Create Event requests.

---

## User Roles

| Role | Permissions |
|------|-------------|
| **organizer** | Create, update, and delete their own events. View all events. |
| **attendee** | Register for events, view their registrations, cancel registrations. View all events. |

Role is set at registration and cannot be changed after signup.

---

## Authentication Flow

```
Register → Login → Use accessToken on protected routes
                ↓
         Access token expires?
                ↓
         POST /refresh (with refreshToken) → New token pair
                ↓
         Logout → POST /logout → Both tokens revoked (blacklisted)
```

### Token types

| Token | Lifetime | Used for |
|-------|----------|----------|
| **Access token** | 15 minutes | `Authorization: Bearer <accessToken>` on all protected routes |
| **Refresh token** | 7 days | `POST /refresh` to get a new token pair |

### Using tokens in requests

```
Authorization: Bearer <your_access_token_here>
```

---

## API Endpoints

### Public routes (no token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and receive tokens |
| `POST` | `/refresh` | Exchange refresh token for new token pair |

### Protected routes (access token required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/logout` | Any | Revoke access and refresh tokens |
| `GET` | `/events` | Any | List all events |
| `GET` | `/events/:id` | Any | Get event by ID |
| `POST` | `/events` | Organizer | Create a new event |
| `PUT` | `/events/:id` | Organizer | Update own event |
| `DELETE` | `/events/:id` | Organizer | Delete own event |
| `POST` | `/events/:id/register` | Attendee | Register for an event |
| `GET` | `/events/my/registrations` | Attendee | View my registered events |
| `DELETE` | `/events/:id/register` | Attendee | Cancel event registration |

---

## End-to-End Usage Guide

Follow these steps in order to test the complete flow.

### Step 1 — Register an organizer

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Organizer",
    "email": "alice@example.com",
    "password": "password123",
    "role": "organizer"
  }'
```

### Step 2 — Register an attendee

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Attendee",
    "email": "bob@example.com",
    "password": "password123",
    "role": "attendee"
  }'
```

### Step 3 — Login as organizer

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Save `accessToken` and `refreshToken` from the response.

### Step 4 — Create an event (organizer)

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ORGANIZER_ACCESS_TOKEN>" \
  -d '{
    "title": "AI Summit 2026",
    "date": "2026-07-15",
    "time": "10:00",
    "description": "Virtual AI conference with industry leaders"
  }'
```

### Step 5 — Login as attendee

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password123"
  }'
```

### Step 6 — Register for the event (attendee)

```bash
curl -X POST http://localhost:3000/events/1/register \
  -H "Authorization: Bearer <ATTENDEE_ACCESS_TOKEN>"
```

A confirmation email is sent (or logged to console if SMTP is not configured).

### Step 7 — View attendee registrations

```bash
curl -X GET http://localhost:3000/events/my/registrations \
  -H "Authorization: Bearer <ATTENDEE_ACCESS_TOKEN>"
```

### Step 8 — Refresh token (when access token expires)

```bash
curl -X POST http://localhost:3000/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

### Step 9 — Logout

```bash
curl -X POST http://localhost:3000/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

---

## Request & Response Format

### Success response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": { "count": 0 }
}
```

`data` and `meta` are included when relevant.

### Validation error response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address." }
  ]
}
```

### General error response

```json
{
  "success": false,
  "message": "Event not found."
}
```

### Login response example

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Alice Organizer",
      "email": "alice@example.com",
      "role": "organizer",
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  }
}
```

### Event object example

```json
{
  "id": 1,
  "title": "AI Summit 2026",
  "date": "2026-07-15",
  "time": "10:00",
  "description": "Virtual AI conference",
  "organizerId": 1,
  "organizerName": "Alice Organizer",
  "participants": [2],
  "participantCount": 1,
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:30:00.000Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Login, get events, register for event |
| `201` | Created | Register user, create event |
| `400` | Bad request | Validation failed, invalid event ID |
| `401` | Unauthorized | Missing/invalid/expired/revoked token |
| `403` | Forbidden | Wrong role, not event owner, CORS blocked |
| `404` | Not found | Event or route not found |
| `409` | Conflict | Duplicate email, duplicate event registration |
| `429` | Too many requests | Rate limit exceeded on login/register |
| `503` | Service unavailable | Email delivery failed during registration |

---

## Security

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt (10 salt rounds) |
| Authentication | JWT access tokens (short-lived) |
| Session renewal | JWT refresh tokens with rotation |
| Logout | In-memory token blacklist (immediate revocation) |
| HTTP headers | Helmet |
| CORS | Restricted to `ALLOWED_ORIGINS` |
| Rate limiting | 100 req/15 min global; 5 login/register attempts/15 min |
| Input validation | express-validator with sanitization on all write endpoints |
| Request size | JSON body limited to 10 KB |
| Authorization | Role-based middleware on all protected routes |

---

## Data Models

### User (in-memory)

```js
{
  id: 1,
  name: "Alice Organizer",
  email: "alice@example.com",
  password: "<bcrypt_hashed>",
  role: "organizer",        // "organizer" | "attendee"
  createdAt: "ISO_string"
}
```

### Event (in-memory)

```js
{
  id: 1,
  title: "AI Summit 2026",
  date: "2026-07-15",       // YYYY-MM-DD
  time: "10:00",            // HH:MM (24-hour)
  description: "Event details",
  organizerId: 1,
  participants: [2, 3],     // array of attendee user IDs
  createdAt: "ISO_string",
  updatedAt: "ISO_string"
}
```

---

## Email Configuration

On successful event registration, a confirmation email is sent to the attendee.

### Gmail setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
```

### Without SMTP (local testing)

If SMTP credentials are not set, registration still succeeds and the email content is **logged to the server console**:

```
[Email - SMTP not configured, logged to console]
To: bob@example.com
Subject: Registration confirmed: AI Summit 2026
...
```

---

## Important Notes

- **In-memory storage** — all users and events are stored in server memory. Data is lost when the server restarts.
- **Passwords are never returned** in any API response.
- **Organizers can only update/delete their own events** — not events created by other organizers.
- **Organizers cannot register for events** — the `/events/:id/register` endpoint is attendee-only.
- **Access token required** for all `/events` routes — use `Authorization: Bearer <accessToken>`.
- **Rate limiting** is active in development/production but disabled during `npm test`.

---

## License

ISC
