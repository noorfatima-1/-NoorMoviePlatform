import { Router } from 'express';
import {
  createWatchParty,
  joinWatchParty,
  updatePartyState,
  endWatchParty,
  getActiveParties,
} from '../controllers/watchPartyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/active', authenticate, getActiveParties);
router.post('/create', authenticate, createWatchParty);
router.post('/join', authenticate, joinWatchParty);
router.put('/:partyId/state', authenticate, updatePartyState);
router.put('/:partyId/end', authenticate, endWatchParty);

export default router;
