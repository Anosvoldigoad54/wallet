/**
 * Database configuration and connection pool.
 * Uses mysql2/promise for async/await support.
 * Table schemas are created automatically on first run.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ─── Connection Pool ──────────────────────────────────────────────────────────

/**
 * mysql2 pool is preferred over a single connection because it:
 * - Reuses connections (avoids the overhead of creating one per request)
 * - Handles concurrent requests gracefully
 * - Auto-reconnects on dropped connections
 */
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,  // Queue requests when pool is full
  connectionLimit: 10,        // Max simultaneous connections
  queueLimit: 0,              // Unlimited queue size
  enableKeepAlive: true,      // Prevent idle connection drops (important for Railway)
  keepAliveInitialDelay: 10000,
});

// ─── Schema Initialization ────────────────────────────────────────────────────

/**
 * Creates the `wallets` and `transactions` tables if they do not already exist.
 * This is called once when the server starts.
 *
 * DECIMAL(15, 4) is used for all monetary values instead of FLOAT because
 * floating-point types (FLOAT, DOUBLE) can cause precision errors in financial
 * calculations (e.g., 10.1 + 20.2 = 30.299999999). DECIMAL stores values exactly.
 */
export async function initDB(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    // Wallets table: stores the wallet owner and current balance
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id          VARCHAR(255)  PRIMARY KEY,
        name        VARCHAR(255)  NOT NULL,
        balance     DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
        date        DATETIME      DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table: an immutable ledger of every debit/credit event
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          VARCHAR(255)     PRIMARY KEY,
        walletId    VARCHAR(255)     NOT NULL,
        amount      DECIMAL(15,4)    NOT NULL,
        balance     DECIMAL(15,4)    NOT NULL,
        description VARCHAR(255),
        type        ENUM('CREDIT','DEBIT') NOT NULL,
        date        DATETIME         DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (walletId) REFERENCES wallets(id)
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}

export default pool;
