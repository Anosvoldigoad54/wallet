# Vault — Digital Wallet System

A full-stack wallet application built for the Full Stack Dev Hiring Challenge.

**Stack:** Node.js · Express.js · TypeScript · MySQL · React · Vite · TailwindCSS

---

## Project Structure

```
wallet/
├── backend/       # Express.js REST API (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts          # MySQL connection pool + schema init
│   │   ├── controllers/
│   │   │   └── wallet.ts      # Business logic for all wallet operations
│   │   ├── routes/
│   │   │   └── wallet.ts      # Express route definitions
│   │   └── index.ts           # Server entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/      # React SPA (Vite + TypeScript + TailwindCSS)
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx        # Setup page + Dashboard
    │   │   └── Transactions.tsx # Transaction history table
    │   ├── api.ts              # Axios API client
    │   └── App.tsx             # Router root
    ├── .env.example
    └── package.json
```

---

## API Reference

### `POST /setup` — Initialise Wallet
Creates a new wallet with an optional starting balance.

**Request Body:**
```json
{ "name": "Alice", "balance": 100.5000 }
```
**Response `200`:**
```json
{
  "id": "a1b2c3d4e5f6",
  "balance": 100.5000,
  "transactionId": "f6e5d4c3b2a1",
  "name": "Alice",
  "date": "2024-01-01T10:00:00.000Z"
}
```

---

### `POST /transact/:walletId` — Credit / Debit
Credits (positive amount) or debits (negative amount) a wallet.
Uses `SELECT ... FOR UPDATE` to prevent race conditions.

**Request Body:**
```json
{ "amount": -25.0000, "description": "Coffee" }
```
**Response `200`:**
```json
{ "balance": 75.5000, "transactionId": "abc123def456" }
```

---

### `GET /transactions` — Fetch Transactions
Returns paginated transaction history for a wallet.

**Query Params:** `walletId`, `skip`, `limit`

**Example:** `/transactions?walletId=a1b2c3&skip=0&limit=10`

**Response `200`:**
```json
[
  {
    "_id": "abc123",
    "walletId": "a1b2c3",
    "amount": 25.0000,
    "balance": 75.5000,
    "description": "Coffee",
    "date": "2024-01-01T11:00:00.000Z",
    "type": "DEBIT"
  }
]
```

---

### `GET /wallet/:id` — Get Wallet Details

**Response `200`:**
```json
{ "id": "a1b2c3", "balance": 75.5000, "name": "Alice", "date": "..." }
```

---

### `GET /health` — Health Check
Used by Railway to verify the service is alive. Returns `{ "status": "ok" }`.

---

## Local Development

### Prerequisites
- Node.js v18+
- MySQL 8+

### Backend
```bash
cd backend
cp .env.example .env        # Fill in your local DATABASE_URL
npm install
npm run dev                 # Starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env        # Set VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # Starts on http://localhost:3000
```

---

## Deployment on Railway

Both services are deployed to Railway with MySQL as the database.

### Backend Service
| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

**Environment Variables:**
| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{ MySQL.MYSQL_URL }}` |
| `NODE_ENV` | `production` |

### Frontend Service
| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Start Command** | `npx vite preview --host 0.0.0.0 --port $PORT` |

**Environment Variables:**
| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Railway backend public URL |

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| `DECIMAL(15,4)` instead of `FLOAT` | Prevents floating-point precision errors in financial math |
| `SELECT ... FOR UPDATE` on transact | Acquires a row lock, preventing race conditions under concurrent requests |
| mysql2 connection pool | Reuses connections, handles concurrency, auto-reconnects on Railway idle drops |
| `_id` in transaction response | Matches the exact field name specified in the problem statement |
| Balance stored per transaction | Allows querying historical balance at any point in time without recalculation |
