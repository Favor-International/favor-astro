// How the giving form reads the server's answer to a gift request, and what it
// may do on the next press. The server says in `retry` whether a failed
// request left the card uncharged (functions/api/_lib/http.ts, GiftRetry).
// Kept out of the component so it can be tested on its own.

export type GiveRetry = 'same' | 'new_checkout' | 'wait' | 'none';

export interface GiveReply {
  ok?: boolean;
  message?: string;
  retry?: GiveRetry;
  amount?: number;
  designation?: string;
  portal_login_url?: string;
}

export type NextStep =
  /** The gift is made. */
  | { kind: 'done'; reply: GiveReply }
  /** Nothing was charged. The next press sends the same authorization and key. */
  | { kind: 'retry_same'; message: string }
  /** Nothing was charged and this authorization cannot be used again. The next press opens the card window. */
  | { kind: 'new_checkout'; message: string }
  /**
   * Nobody knows yet whether the card was charged. The next press sends the
   * same request again, and the server answers for the attempt already made.
   */
  | { kind: 'unresolved'; message: string };

const CONTACT = 'info@favorintl.org';

export const LOST_CONNECTION =
  'We lost the connection before your gift was confirmed. Press the button to check on it. It will not charge your card a second time.';

/** `status` is null when no answer came back at all; `reply` is null when the answer was not JSON. */
export function readGiveReply(status: number | null, reply: GiveReply | null): NextStep {
  if (status === null || !reply || typeof reply !== 'object') {
    return { kind: 'unresolved', message: LOST_CONNECTION };
  }
  if (status >= 200 && status < 300 && reply.ok === true) return { kind: 'done', reply };
  const message = (reply.message || 'The gift could not be completed.').trim();
  const said = /[.!?]$/.test(message) ? message : `${message}.`;
  if (reply.retry === 'wait' || reply.retry === 'none') return { kind: 'unresolved', message: said };
  // A server error with no retry advice did not come from the gift routes'
  // own error handling, so it says nothing about the charge.
  if (!reply.retry && status >= 500) return { kind: 'unresolved', message: LOST_CONNECTION };
  if (reply.retry === 'new_checkout') {
    return {
      kind: 'new_checkout',
      message: `${said} Your card was not charged. Press the button to enter your card again, or email ${CONTACT} and we will finish it with you.`,
    };
  }
  return {
    kind: 'retry_same',
    message: `${said} Your card was not charged. Press the button to try again, or email ${CONTACT} and we will finish it with you.`,
  };
}
