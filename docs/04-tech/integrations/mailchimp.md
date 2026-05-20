# Mailchimp Integration

Mailchimp handles the newsletter, partner segments, and any
automation flows downstream of giving events.

## Scope of the website's role

- Add a new subscriber from the homepage and footer signup forms.
- Add a new subscriber from the 30-day prayer guide download.
- Tag subscribers by source so segmentation works downstream.
- Sync giving status changes (becomes-a-partner, lapses) via Blackbaud
  → Mailchimp existing pipeline. The website does **not** push gift
  data directly to Mailchimp.

## List structure

Single audience, multiple tags:

| Tag                | Trigger                                  |
|--------------------|------------------------------------------|
| `newsletter`       | Newsletter signup from any form          |
| `prayer-guide`     | 30-day prayer guide download             |
| `vision-trip-interest` | Vision trip inquiry form             |
| `church-interest`  | Church partnership inquiry               |
| `foundation-interest` | Foundation inquiry                    |
| `web-partner`      | First recurring gift via website         |
| `web-one-time`     | First one-time gift via website          |
| `book-buyer`       | Stripe shop purchase                     |

Geographic, country-focus, and donor-value tags are managed in
Blackbaud and synced through, not set by the website.

## Pages Function: subscribe

```ts
// functions/api/subscribe.ts
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { email, tag } = await ctx.request.json();

  await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.env.MAILCHIMP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      tags: [tag],
    }),
  });

  return Response.json({ ok: true });
};
```

Always verify Turnstile before calling Mailchimp.

## Double opt-in

Off for tag-based signups from a known intent (prayer guide, partner
signup post-gift). On for the generic newsletter form to keep list
quality high.

## Privacy

- One-line privacy note next to every email field: "We email the field
  report once a month. Unsubscribe anytime."
- Link to `/legal/privacy/` on every form.
- Never share, sell, or rent the list. State this on the privacy page.

## Automation flows owned by Mailchimp (not the website)

- New subscriber welcome series.
- New partner onboarding series.
- Lapsed partner re-engagement.
- Monthly newsletter.

The website triggers entry into these via tag assignment. Mailchimp
handles the rest.

## Action items before build

- [ ] Confirm the Mailchimp audience ID and data center prefix.
- [ ] Get an API key scoped to that audience (read/write members).
- [ ] Audit existing tags and merge fields. Do not duplicate.
- [ ] Confirm the 30-day prayer guide PDF location (R2 bucket).
