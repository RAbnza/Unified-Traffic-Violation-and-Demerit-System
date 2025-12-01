# Unified Traffic Violation & Demerit System

A simple full-stack project with an Express backend and a Vite + React frontend styled with Tailwind CSS v4.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

## Project Structure

```
backend/   # Express API (port 3000 by default)
frontend/  # Vite + React + Tailwind v4 (port 5173 by default)
```

## Install Dependencies

Run installs for both apps (from the repository root):

```powershell
npm install --prefix frontend
npm install --prefix backend
```

## Development

From the repository root, you can use these scripts:

```powershell
# Start frontend (Vite dev server)
npm run dev

# Start frontend explicitly
npm run dev:frontend

# Start backend (Express with nodemon)
npm run dev:backend
```

Notes:

- Run frontend and backend in two terminals for full-stack dev.
- If `npm run dev:backend` fails, ensure backend deps are installed:
  ```powershell
  npm install --prefix backend
  ```

## API Endpoint (Test)

- GET `http://localhost:3000/api/test` → `{ "message": "Backend is running!" }`

The frontend fetches this endpoint on load and displays the message.

## Environment Variables (Backend)

Create `backend/.env` if you want to override defaults:

```env
PORT=3000
```

- Default `PORT` is 3000 when not set.
- CORS is enabled in development to allow the Vite dev server to call the API.

## Tailwind CSS v4 Setup (Frontend)

This project is configured for Tailwind v4 using PostCSS:

- `frontend/postcss.config.js` uses `@tailwindcss/postcss` + `autoprefixer`.
- `frontend/src/index.css` imports Tailwind:
  ```css
  @import "tailwindcss";
  ```
- Tailwind v4 no longer requires `tailwind.config.js` for basic use. Avoid `npx tailwindcss init -p` unless you need advanced customization.

## Build

Build the frontend for production:

```powershell
npm run build
```

The output is generated in `frontend/dist/`.

## Start Backend in Production

```powershell
npm run start
```

## Common Issues

- Missing dependencies: run installs per app using `--prefix` as shown above.
- Port conflicts: change `PORT` in `backend/.env`, and point the frontend to the new API base if you move it.

## Scripts Reference (Root)

- `dev`: runs `frontend` dev server
- `dev:frontend`: runs `frontend` dev server
- `dev:backend`: runs `backend` with nodemon
- `build`: builds the `frontend`
- `start`: starts the `backend`

---

If you’d like a single command to run both frontend and backend together (e.g., via `concurrently`), I can add it—just say the word.
