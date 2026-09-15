// Staff notice after a successful website or portal gift.
// Michael and Crystal used to get Blackbaud Donation Form emails on every
// new gift (Daniel, 2026-09-08). The API path never sent those. This mails
// usdonations@favorintl.org and must never fail the gift.

import type { Env } from './blackbaud';

const LOGO =
  'https://storage.googleapis.com/msgsndr/LblL0AiRWSIvV6fFQuRT/media/67bf4d8383ae0d6d7dc507fe.png';
const DEFAULT_TO = 'usdonations@favorintl.org';
const DEFAULT_FROM = 'Favor International <noreply@mail.favorintl.org>';

export interface StaffGiftNotice {
  amount: number;
  frequency: 'once' | 'monthly';
  designation: string;
  giftId: string;
  paymentGiftId?: string;
  giftDate: string;
  donor: { first: string; last: string; email: string; phone?: string; org_name?: string };
  anonymous?: boolean;
  note?: string;
  campaignSource?: string;
  campaignRef?: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function dateLabel(iso: string): string {
  const day = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const [y, m, d] = day.split('-');
    return `${m}/${d}/${y}`;
  }
  return iso;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#666;width:160px;vertical-align:top">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#1a1a1a">${esc(value)}</td>
  </tr>`;
}

export async function notifyStaffGift(env: Env, notice: StaffGiftNotice): Promise<void> {
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.warn('[gift-notify] RESEND_API_KEY missing; skipped');
    return;
  }
  const to = (env.GIFT_NOTIFY_TO || DEFAULT_TO)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s));
  if (!to.length) {
    console.warn('[gift-notify] no recipients');
    return;
  }

  const kind = notice.frequency === 'monthly' ? 'Monthly gift' : 'One-time gift';
  const name = `${notice.donor.first} ${notice.donor.last}`.trim();
  const org = notice.donor.org_name?.trim();
  const subject = `${kind}: ${money(notice.amount)} · ${notice.designation}`;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FFFEF9;font-family:Montserrat,-apple-system,'Segoe UI',sans-serif">
  <table role="presentation" style="width:100%;border-collapse:collapse">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" style="width:560px;max-width:100%;border-collapse:collapse;background:#fff;border-radius:8px">
        <tr>
          <td style="padding:28px 32px 16px;text-align:center;border-bottom:3px solid #2b4d24">
            <img src="${LOGO}" alt="Favor International" style="max-width:180px;height:auto">
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8b957b">New gift</p>
            <h1 style="margin:0 0 20px;font-size:22px;color:#1a1a1a">${esc(money(notice.amount))} · ${esc(kind)}</h1>
            <table role="presentation" style="width:100%;border-collapse:collapse">
              ${row('Amount', money(notice.amount))}
              ${row('Gift date', dateLabel(notice.giftDate))}
              ${row('Type', kind)}
              ${row('In support of', notice.designation)}
              ${row('Payment', 'Credit card')}
              ${row('Organization gift', org ? `Yes · ${org}` : 'No')}
              ${row('Comment', notice.note || '(none)')}
              ${notice.anonymous ? row('Anonymous receipt', 'Donor asked to stay anonymous on the public receipt') : ''}
              ${notice.campaignSource ? row('Campaign', `${notice.campaignSource}${notice.campaignRef ? ` · ${notice.campaignRef}` : ''}`) : ''}
              ${row('Gift ID', notice.giftId)}
              ${notice.paymentGiftId ? row('Payment gift ID', notice.paymentGiftId) : ''}
            </table>
            <p style="margin:22px 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8b957b">Donor</p>
            <table role="presentation" style="width:100%;border-collapse:collapse">
              ${row('Name', name || '(none)')}
              ${row('Email', notice.donor.email)}
              ${row('Phone', notice.donor.phone || '(none)')}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#1a1a1a;text-align:center">
            <p style="margin:0;font-size:13px;color:#c5ccc2">Transformed Hearts Transform Nations</p>
            <p style="margin:8px 0 0;font-size:12px;color:#999">Favor International is a 501(c)(3) public charity. EIN 47-5225697<br>3433 Lithia Pinecrest Rd. #356, Valrico, FL 33596</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM || DEFAULT_FROM,
      to,
      subject,
      html,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('[gift-notify] resend failed', res.status, detail.slice(0, 240));
  }
}
