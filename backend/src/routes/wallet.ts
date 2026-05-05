/**
 * Wallet API Routes
 * Maps HTTP methods + paths to their corresponding controller functions.
 *
 * POST /setup              → Create a new wallet
 * POST /transact/:walletId → Credit or debit a wallet
 * GET  /transactions       → Fetch paginated transaction history
 * GET  /wallet/:id         → Get wallet details
 */

import { Router } from 'express';
import {
  setupWallet,
  transact,
  getTransactions,
  getWallet,
} from '../controllers/wallet';

const router = Router();

router.post('/setup', setupWallet);
router.post('/transact/:walletId', transact);
router.get('/transactions', getTransactions);
router.get('/wallet/:id', getWallet);

export default router;
