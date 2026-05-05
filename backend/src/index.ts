/**
 * Entry point for the Vault Wallet Backend.
 * Initializes Express server, middleware, routes, and database.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db';
import walletRoutes from './routes/wallet';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

// Enable CORS for all origins (safe since no auth is required per spec)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * Used by Railway (and monitoring tools) to verify the service is alive.
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/', walletRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

// Catches any unhandled errors thrown inside route handlers
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await initDB();
  } catch (err) {
    // Log but do not crash — missing DATABASE_URL will show up clearly in logs
    console.error('❌ Could not initialize DB. Is DATABASE_URL set?', err);
  }
});
