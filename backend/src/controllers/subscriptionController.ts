import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// Get current subscription
export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user!.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    // Return free plan if no subscription exists
    const subscription = data || {
      user_id: req.user!.id,
      plan: 'free',
      status: 'active',
    };

    res.json({ success: true, data: subscription });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
};

// Create checkout session (Stripe integration point)
export const createCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan } = req.body;

  if (!plan || !['premium', 'family'].includes(plan)) {
    res.status(400).json({ success: false, error: 'Invalid plan. Choose premium or family' });
    return;
  }

  try {
    // In production, create a Stripe checkout session here
    // For now, simulate by creating/updating the subscription directly
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: req.user!.id,
        plan,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data,
      message: `Subscribed to ${plan} plan. In production, this would redirect to Stripe checkout.`,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create checkout' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled', plan: 'free', updated_at: new Date().toISOString() })
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data, message: 'Subscription canceled' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
};

// Stripe webhook handler (placeholder)
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  // In production: verify Stripe signature, handle checkout.session.completed,
  // customer.subscription.updated, customer.subscription.deleted events
  const event = req.body;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Update subscription in database
        break;
      case 'customer.subscription.updated':
        // Update subscription status
        break;
      case 'customer.subscription.deleted':
        // Downgrade to free
        break;
      default:
        break;
    }

    res.json({ received: true });
  } catch {
    res.status(400).json({ success: false, error: 'Webhook handler failed' });
  }
};
