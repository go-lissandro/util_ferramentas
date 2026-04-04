import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';
import { AppError } from '../utils/AppError';

export const billingRouter = Router();

billingRouter.use(authenticate);

// ── GET /api/billing/plans ─────────────────────────────
billingRouter.get('/plans', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'usd',
        interval: null,
        features: [
          'Up to 2 apps',
          '100 API requests/day',
          '50 URL shortenings/month',
          'Community support',
        ],
        limits: {
          urlShortenings: 50,
          apiRequests: 100,
          teamMembers: 1,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        currency: 'usd',
        interval: 'month',
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        features: [
          'Unlimited apps',
          '10,000 API requests/day',
          'Unlimited URL shortenings',
          'Priority support',
          'Custom domain',
          'Advanced analytics',
        ],
        limits: {
          urlShortenings: -1,      // unlimited
          apiRequests: 10000,
          teamMembers: 10,
        },
      },
    ],
  });
});

// ── GET /api/billing/subscription ─────────────────────
billingRouter.get('/subscription', async (req: Request, res: Response) => {
  const tenant = await db.queryOne<{
    plan: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
  }>(
    'SELECT plan, stripe_customer_id, stripe_subscription_id FROM tenants WHERE id = $1',
    [req.user!.tenantId]
  );

  return res.json({
    success: true,
    data: {
      plan: tenant?.plan || 'free',
      hasActiveSubscription: !!tenant?.stripe_subscription_id,
    },
  });
});

// ── POST /api/billing/checkout ─────────────────────────
// In production: create Stripe Checkout Session
billingRouter.post('/checkout', async (req: Request, res: Response) => {
  const { planId } = req.body;

  if (planId !== 'pro') {
    throw new AppError('Invalid plan', 400, 'VALIDATION_ERROR');
  }

  // TODO: integrate Stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  // const session = await stripe.checkout.sessions.create({...})

  return res.json({
    success: true,
    data: {
      // checkoutUrl: session.url,
      message: 'Stripe integration ready — add STRIPE_SECRET_KEY to enable',
    },
  });
});

// ── POST /api/billing/webhook ──────────────────────────
// Stripe webhook handler (no auth middleware)
export const webhookRouter = Router();

webhookRouter.post(
  '/api/webhooks/stripe',
  async (req: Request, res: Response) => {
    // In production: verify Stripe signature
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    const event = req.body;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await db.query(
          `UPDATE tenants SET plan = 'pro', stripe_subscription_id = $1, updated_at = NOW()
           WHERE stripe_customer_id = $2`,
          [subscription.id, customerId]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await db.query(
          `UPDATE tenants SET plan = 'free', stripe_subscription_id = NULL, updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [subscription.customer]
        );
        break;
      }
    }

    return res.json({ received: true });
  }
);
