/**
 * Wallet Controller
 *
 * Contains all the business logic for wallet operations:
 *  - setupWallet    → Initialise a new wallet
 *  - transact       → Credit / Debit a wallet (race-condition safe)
 *  - getTransactions → Paginated transaction history
 *  - getWallet      → Wallet details by ID
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a random 12-character hexadecimal string to use as a unique ID.
 * Example output: "a3f9c12d0e6b"
 */
function generateId(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Rounds a number to exactly 4 decimal places.
 * Uses toFixed(4) + parseFloat to remove unnecessary trailing characters.
 */
function to4dp(value: number): number {
  return parseFloat(value.toFixed(4));
}

// ─── POST /setup ──────────────────────────────────────────────────────────────

/**
 * Initialise a new wallet.
 *
 * @body  { balance: number, name: string }
 * @returns { id, balance, transactionId?, name, date }
 */
export const setupWallet = async (req: Request, res: Response): Promise<void> => {
  const { balance, name } = req.body;

  // Validate input types
  if (typeof balance !== 'number' || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({
      error: 'Invalid input. Required: balance (number) and name (non-empty string).',
    });
    return;
  }

  const walletId = generateId();
  const transactionId = generateId();
  const parsedBalance = to4dp(balance);
  const date = new Date();

  // Use a transaction so that wallet + initial transaction are always created together.
  // If either INSERT fails, the whole operation is rolled back.
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO wallets (id, name, balance, date) VALUES (?, ?, ?, ?)',
      [walletId, name.trim(), parsedBalance, date]
    );

    // Only create a setup transaction if initial balance is greater than zero
    if (parsedBalance > 0) {
      await connection.query(
        `INSERT INTO transactions
           (id, walletId, amount, balance, description, type, date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, walletId, parsedBalance, parsedBalance, 'Setup', 'CREDIT', date]
      );
    }

    await connection.commit();

    res.status(200).json({
      id: walletId,
      balance: parsedBalance,
      ...(parsedBalance > 0 && { transactionId }),
      name: name.trim(),
      date,
    });
  } catch (error) {
    await connection.rollback();
    console.error('[setupWallet] Error:', error);
    res.status(500).json({ error: 'Failed to setup wallet.' });
  } finally {
    connection.release();
  }
};

// ─── POST /transact/:walletId ─────────────────────────────────────────────────

/**
 * Credit or debit an existing wallet.
 *
 * Positive `amount` → CREDIT (adds money)
 * Negative `amount` → DEBIT  (removes money)
 *
 * Race condition prevention:
 * We use `SELECT ... FOR UPDATE` which places a row-level lock on the wallet row
 * inside a transaction. If two requests arrive simultaneously, the second one
 * will wait until the first commits, ensuring the balance is always accurate.
 *
 * @param  walletId (URL param)
 * @body   { amount: number, description: string }
 * @returns { balance: number, transactionId: string }
 */
export const transact = async (req: Request, res: Response): Promise<void> => {
  const { walletId } = req.params;
  const { amount, description } = req.body;

  if (typeof amount !== 'number' || typeof description !== 'string') {
    res.status(400).json({
      error: 'Invalid input. Required: amount (number) and description (string).',
    });
    return;
  }

  const parsedAmount = to4dp(amount);
  const type = parsedAmount >= 0 ? 'CREDIT' : 'DEBIT';
  const absAmount = to4dp(Math.abs(parsedAmount));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock this wallet's row until we finish updating it
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT balance FROM wallets WHERE id = ? FOR UPDATE',
      [walletId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Wallet not found.' });
      return;
    }

    const currentBalance = parseFloat(rows[0].balance);
    const newBalance = to4dp(currentBalance + parsedAmount);

    // Update the wallet's running balance
    await connection.query(
      'UPDATE wallets SET balance = ? WHERE id = ?',
      [newBalance, walletId]
    );

    // Record the transaction as an immutable ledger entry
    const transactionId = generateId();
    await connection.query(
      `INSERT INTO transactions
         (id, walletId, amount, balance, description, type, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, walletId, absAmount, newBalance, description, type, new Date()]
    );

    await connection.commit();
    res.status(200).json({ balance: newBalance, transactionId });
  } catch (error) {
    await connection.rollback();
    console.error('[transact] Error:', error);
    res.status(500).json({ error: 'Failed to process transaction.' });
  } finally {
    connection.release();
  }
};

// ─── GET /transactions ────────────────────────────────────────────────────────

/**
 * Fetch paginated transactions for a wallet.
 *
 * @query { walletId: string, skip: number, limit: number }
 * @returns Transaction[]
 */
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  const walletId = req.query.walletId as string;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  if (!walletId) {
    res.status(400).json({ error: 'Query param `walletId` is required.' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM transactions
       WHERE walletId = ?
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [walletId, limit, skip]
    );

    // Map DB rows to the API response shape defined in the spec
    const transactions = rows.map((row) => ({
      _id: row.id,
      walletId: row.walletId,
      amount: parseFloat(row.amount),
      balance: parseFloat(row.balance),
      description: row.description,
      date: row.date,
      type: row.type,
    }));

    res.status(200).json(transactions);
  } catch (error) {
    console.error('[getTransactions] Error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

// ─── GET /wallet/:id ──────────────────────────────────────────────────────────

/**
 * Fetch wallet details by ID.
 *
 * @param id (URL param)
 * @returns { id, balance, name, date }
 */
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, balance, date FROM wallets WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Wallet not found.' });
      return;
    }

    res.status(200).json({
      id: rows[0].id,
      balance: parseFloat(rows[0].balance),
      name: rows[0].name,
      date: rows[0].date,
    });
  } catch (error) {
    console.error('[getWallet] Error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet.' });
  }
};
