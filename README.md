# CityGeo Location Lookup

Simple full-stack app to retrieve geographic location of a city by name.

- Backend: Node.js + Express + SQLite (better-sqlite3) + JWT auth
- Frontend: React + Vite
- Geocoding: free provider (OpenStreetMap Nominatim)

Developed in GitHub Codespaces.

## Getting started

```bash
# in Codespace
npm run install:all
cp backend/.env.example backend/.env
# edit backend/.env
docker compose up -d
npm run dev
```

Backend runs on http://localhost:4000
Frontend runs on http://localhost:5173

## Features

- Username/password registration & login
- JWT protected endpoints
- City geocode lookup with history tracking
- User search history page
