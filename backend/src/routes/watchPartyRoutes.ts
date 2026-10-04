import { Router } from 'express';
import {
  createWatchParty,
  joinWatchParty,
  updatePartyState,
  endWatchParty,
  getActiveParties,
  sendMessage,
  getMessages,
} from '../controllers/watchPartyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/active', authenticate, getActiveParties);
router.post('/create', authenticate, createWatchParty);
router.post('/join', authenticate, joinWatchParty);
router.put('/:partyId/state', authenticate, updatePartyState);
router.put('/:partyId/end', authenticate, endWatchParty);
router.post('/:partyId/messages', authenticate, sendMessage);
router.get('/:partyId/messages', authenticate, getMessages);

export default router;
