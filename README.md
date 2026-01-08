# Unified Traffic Violation & Demerit System

A simple full-stack project with an Express backend and a Vite + React frontend styled with Tailwind CSS v4.

## Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+
- **MySQL**: Local server or managed cloud instance

## Project Structure

```text
root/
├── backend/   # Express API (Port 3000)
└── frontend/  # Vite + React + Tailwind v4 (Port 5173)
```

---

## Frontend Setup

Step-by-step guide to set up and run the Vite + React frontend.

### 1. Installation

Clone the repository:

```bash
git clone https://github.com/<your-org>/Unified-Traffic-Violation-and-Demerit-System.git
cd Unified-Traffic-Violation-and-Demerit-System
```

Install frontend dependencies:

```bash
npm install --prefix frontend
```

### 2. Build & Preview

Build the production bundle and preview it locally:

```bash
# Build (from root; proxies to frontend build)
npm run build

# Preview (serve the built files)
npm --prefix frontend run preview
```

### 3. Run the Dev Server

From the repository root, start the frontend in development mode:

```bash
# Option A: Root script (proxies to frontend)
npm run dev

# Option B: Explicitly target the frontend folder
npm run dev:frontend
```
- Dev server (default): http://localhost:5173 (Vite will pick another port if busy)

### 4. Quick Test (Login)

1. Open the app in your browser: http://localhost:5173
2. Navigate to the login page: http://localhost:5173/login
3. Ensure the backend is running on http://localhost:3000
4. Use any account from “Sample Accounts” below (e.g., `officer1` / `password`).


---

## Backend Setup

Step-by-step guide to set up and run the Express backend with MySQL.

### 1. Installation & Environment

Install backend dependencies:

```bash
npm install --prefix backend
```

Configure environment variables (bash):

```bash
cp backend/.env.example backend/.env
```

> **Important:** Open `backend/.env` and configure your Database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

### 2. Database Initialization

Use the following npm scripts to set up your MySQL database:

Recommended (migrate + seed):

```bash
npm run --prefix backend db:bootstrap
```

| Command | Description |
| :--- | :--- |
| `npm run --prefix backend db:migrate` | Runs schema migrations only. |
| `npm run --prefix backend db:seed` | Populates the database with sample data (Idempotent). |
| `npm run --prefix backend db:reset` | Drops the database, re-migrates, and re-seeds. |
| `npm run --prefix backend db:reseed:force` | Truncates data and re-seeds without dropping schema. |

### 3. Running the Server

Start the backend in development mode:

```bash
npm run dev:backend
```

- **API URL:** `http://localhost:3000` (Configurable via `PORT` in `.env`)
- **Check Status:** `curl -i http://localhost:3000/api/test`
- **Check DB:** `curl -i http://localhost:3000/api/test/db`

---

## Sample Accounts (Development)

Use these credentials to test different role-based permissions:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `password` |
| **Officer** | `officer1` | `password` |
| **Auditor** | `auditor` | `password` |
| **LGU Admin** | `lguadmin` | `password` |
| **LGU Staff** | `lgustaff` | `password` |

---

## Core Endpoints Overview

The API responses follow a unified structure: `{ data, meta, error }`.

- **Auth:** `POST /api/auth/login`, `POST /api/auth/logout`
- **Users/Roles:** List, create, and update users and permissions.
- **Tickets:** Create, update, add violations, and list tickets with filters.
- **Payments:** Create payments and view daily transaction reports.
- **Audit Logs:** View system logs with filtering capabilities.
- **System:** Database status, config upsert, and backup/restore history.

---

## Troubleshooting

- **Dependency Errors:** Run `npm install --prefix backend` to ensure all packages are present.
- **Database Reset Fails:** Ensure your MySQL user has `DROP DATABASE` privileges before running `db:reset`.
- **Port Conflicts:** If port 3000 is in use, update the `PORT` variable in `backend/.env`.
- **401 Unauthorized:** Ensure requests include the header `Authorization: Bearer <token>`.