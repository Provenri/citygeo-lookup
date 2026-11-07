# CityGeo Lookup - Implementation Plan

## Overview
CityGeo Lookup is a separated frontend/backend application that allows authenticated users to search for a city name and retrieve its geographic location. User management and search history are persisted in a local database.

Development will be done in GitHub Codespaces so no local Node.js/SQLite installation is required on the user's machine.

## Tech Stack - Approved
- **Backend:** Node.js + Express
- **Database:** SQLite with better-sqlite3 / Prisma SQLite
- **Frontend:** React + Vite
- **Geocoder:** Free provider - OpenStreetMap Nominatim
- **Auth:** JWT with bcrypt password hashing
- **Dev Environment:** GitHub Codespaces with devcontainer

## Architecture
Frontend SPA communicates with Backend REST API over HTTP with CORS enabled. Backend handles authentication, geocoding requests, and history persistence.

```
frontend React/Vite  <->  backend Express  <->  SQLite DB
                               |
                         Nominatim API
```

All code runs inside a GitHub Codespace container. The Codespace provides Node.js, SQLite and git out of the box.

## Database Schema

**users**
- id INTEGER PRIMARY KEY AUTOINCREMENT
- username TEXT UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP

**searches**
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- city_name TEXT NOT NULL
- country TEXT
- lat REAL
- lon REAL
- display_name TEXT
- searched_at DATETIME DEFAULT CURRENT_TIMESTAMP

Indexes: users.username, searches.user_id, searches.searched_at DESC

## Backend API

Base URL: http://localhost:4000/api

- POST /auth/register
  Body: { username, password }
  Returns: 201 created

- POST /auth/login
  Body: { username, password }
  Returns: { token }

- GET /cities/search?q=cityName
  Headers: Authorization: Bearer <token>
  Calls Nominatim, returns { city_name, country, lat, lon, display_name }
  Saves search to searches table

- GET /history
  Headers: Authorization: Bearer <token>
  Returns list of user searches ordered by searched_at DESC

- GET /health
  Returns { status: "ok" }

Middleware: JWT auth, input validation with Zod, rate limiting, error handler

## Frontend Pages

- /login - Username/password login
- /register - Create account
- /search - Input city name, display location result map/link
- /history - Table of past searches with timestamp

State management: React Query for API data, Context for auth token

## Security
- Passwords hashed with bcrypt, salt rounds 10+
- JWT secret in .env, HttpOnly cookie or memory storage
- Input sanitization for city query
- CORS limited to frontend origin
- Nominatim usage policy compliance, add request delay and caching

## Development Environment - GitHub Codespaces

No local installs required. All development happens in a GitHub Codespace.

Prerequisites:
- GitHub account with Codespaces enabled
- Repository cloned to GitHub

Devcontainer setup:
- .devcontainer/devcontainer.json defines Node.js 20 image with extensions
- Post-create commands install backend/frontend dependencies
- Ports 4000 and 5173 forwarded automatically
- SQLite data persists via Codespace storage

Workflow:
1. Open repo in Codespaces -> Create new Codespace
2. Wait for container build and npm install
3. Run backend: npm run dev in backend/
4. Run frontend: npm run dev in frontend/
5. Access via Codespaces preview URLs

Benefits:
- Zero local setup
- Consistent environment
- Pre-installed Node.js, npm, SQLite3
- Easy sharing and CI

## Development Phases

1. Project setup
   - Create backend and frontend folders
   - Add .devcontainer/ with devcontainer.json for Codespaces
   - Init Node.js projects, install dependencies
   - Configure SQLite DB and Prisma schema
   - Test Codespace startup and port forwarding

2. Authentication
   - Register/login endpoints
   - JWT middleware
   - Frontend login/register forms

3. Geocoding & History
   - Implement /cities/search with Nominatim
   - Save search to DB
   - Implement /history endpoint

4. Frontend integration
   - Search page with API call
   - History page
   - Auth flow with token persistence

5. Testing & Polish
   - End-to-end flow test
   - Error handling and loading states
   - README and .env examples

## Environment Variables

Backend .env
- PORT=4000
- JWT_SECRET=
- DB_PATH=./data/app.db
- NOMINATIM_DELAY_MS=1000

Frontend .env
- VITE_API_URL=http://localhost:4000/api

## Project Structure
AI_location_project/
  backend/
    src/
      routes/
      middleware/
      services/
    prisma/
    data/
    .env
  frontend/
    src/
      pages/
      components/
      services/
    .env
  PLAN.md
