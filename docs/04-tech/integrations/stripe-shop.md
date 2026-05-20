# Stripe Shop Integration

Stripe handles the small books and merchandise shop at `/shop/`. The
shop is intentionally minimal. No headless cart, no inventory engine,
no shipping calculator. Stripe Checkout does the heavy lifting.

## Architecture

```
Astro static product pages (MDX in src/content/products/)
        │
        ▼
   "Buy" button (client island)
        │
        ▼  POST /api/shop/checkout
Pages Function: create Stripe Checkout Session
        │
        ▼  redirect to Stripe-hosted checkout
   Stripe Checkout
        │
        ▼  success → /shop/thank-you?session_id=...
        ▼  webhook → /api/webhooks/stripe → fulfillment record
```

## Products

Source of truth is Stripe Dashboard products and prices. We mirror
each product as an MDX file in `src/content/products/` for the SEO
landing page:

```
src/content/products/
├── enemies-of-god.mdx
├── too-great-and-too-marvelous.mdx
├── the-keeping.mdx
└── favor-tshirt.mdx
```

Frontmatter contains the Stripe `price_id`, title, summary, cover
image, and inventory note. The body is the long-form description.

## Why not a headless cart

Average order has one or two items. A full cart adds tax, shipping
logic, abandoned cart emails, and persistent state we do not need.
Stripe Checkout supports multi-quantity per session if the customer
wants two of something.

## Pages Function: create-checkout

```ts
// functions/api/shop/checkout.ts
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { priceId, quantity = 1 } = await ctx.request.json();
  const stripe = new Stripe(ctx.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity }],
    success_url: `${ctx.env.SITE_URL}/shop/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ctx.env.SITE_URL}/shop/`,
    shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB'] },
    automatic_tax: { enabled: true },
  });

  return Response.json({ url: session.url });
};
```

## Webhook: order paid

```ts
// functions/api/webhooks/stripe.ts
```

On `checkout.session.completed`:

- Log the order to a fulfillment list (Cloudflare KV or a Notion
  database via the existing Composio MCP, whichever Will prefers).
- Email the fulfillment alias `shop@favorintl.org` with order details.
- Optionally tag the buyer in Mailchimp as `Book Buyer`.

We do not store payment data. Stripe owns it.

## Shipping

Flat-rate shipping per region, configured in Stripe Dashboard
shipping rates. No real-time carrier rate logic.

## Tax

`automatic_tax: { enabled: true }`. Stripe Tax handles US sales tax
nexus. Confirm Favor is registered in the right states before going
live, or disable tax and price-inclusive instead.

## Inventory

Stripe Dashboard inventory field is the source of truth. On the
product MDX page, show "In stock" or "Out of stock" by fetching the
current price's metadata at build time, or pin a manual override in
the MDX frontmatter.

## Refunds and returns

Manual in Stripe Dashboard. The website does not expose a return
workflow.

## Action items before build

- [ ] Confirm Stripe account ownership and tax registration.
- [ ] List initial product catalog with cover images and copy.
- [ ] Decide shipping zones and flat rates.
- [ ] Decide on order notification target (email vs Notion vs other).
