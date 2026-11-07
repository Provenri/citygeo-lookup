# CityGeo Lookup

CityGeo Lookup is a React and Express application for authenticated city lookups. Search results and per-user search history are stored in SQLite through Prisma. Geocoding uses OpenStreetMap Nominatim.

## Run in Codespaces

The dev container installs both applications after creation. The frontend requires Node.js 20.19 or later on Node 20, or Node.js 22.12 or later. For a local checkout, install dependencies with `npm install --prefix backend` and `npm install --prefix frontend`.

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

### Optional AI assistant

Create an [OpenRouter API key](https://openrouter.ai/keys) and set `OPENROUTER_API_KEY` in `backend/.env`, then restart the backend. Never commit or share the key. Without it, the assistant is unavailable but normal search still works.

The assistant uses OpenRouter's `openrouter/free` router, which chooses an available free model. Free models can be slow, unavailable, or rate-limited; the app also limits each user to five requests per minute and one concurrent request per backend process. No paid model fallback is configured.

Assistant messages and recent conversation context are sent to OpenRouter and its selected model provider. Do not include sensitive information. The app does not store chat history; the conversation and current search remain in memory when navigating between Search and History, but are cleared when you log out or reload. Press Enter to send a question, or Shift+Enter for a new line. AI answers and population or distance estimates may be incorrect or out of date. Suggested cities are independently geocoded only when you choose “Show on map”; that lookup is saved to your search history.

## Checks

Run the backend tests with `cd backend && npm test` and frontend tests with `cd frontend && npm test`. Build the frontend with `cd frontend && npm run build`.

## Features

- Username and password registration and login
- JWT-protected city search
- Search history scoped to the signed-in user
- Nominatim request pacing and in-memory caching
- City autocomplete with disambiguation (state/country), powered by Photon
- Interactive OpenStreetMap map (Leaflet) for each result
- Optional natural-language city assistant using OpenRouter free models
