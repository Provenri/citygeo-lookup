# CityGeo Lookup

CityGeo Lookup is a React and Express application for authenticated city lookups. Search results and per-user search history are stored in SQLite through Prisma. Geocoding uses OpenStreetMap Nominatim.

## Run in Codespaces

The dev container installs both applications after creation. For a local checkout, install dependencies with `npm install --prefix backend` and `npm install --prefix frontend`.

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `JWT_SECRET` to a unique secret of at least 32 characters and `NOMINATIM_CONTACT` to a real contact email or URL. Keep the secret private.
3. In a terminal, initialize the Prisma client and SQLite database, then start the API:

	```bash
	cd backend
	npm run db:setup
	npm run dev
	```

4. In a second terminal, start the frontend:

	```bash
	cd frontend
	npm run dev
	```

Open the forwarded frontend port `5173`. The API listens on port `4000`; Vite proxies `/api` requests to it. The health endpoint is `http://localhost:4000/health`.

## Checks

Run the backend tests with `cd backend && npm test`. Build the frontend with `cd frontend && npm run build`.

## Features

- Username and password registration and login
- JWT-protected city search
- Search history scoped to the signed-in user
- Nominatim request pacing and in-memory caching
- City autocomplete with disambiguation (state/country), powered by Photon
- Interactive OpenStreetMap map (Leaflet) for each result
