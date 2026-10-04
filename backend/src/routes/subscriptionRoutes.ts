import { Router } from 'express';
import {
  getSubscription,
  createCheckout,
  cancelSubscription,
  stripeWebhook,
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSubscription);
router.post('/checkout', authenticate, createCheckout);
router.post('/cancel', authenticate, cancelSubscription);
router.post('/webhook', stripeWebhook); // No auth - Stripe sends this

export default router;
