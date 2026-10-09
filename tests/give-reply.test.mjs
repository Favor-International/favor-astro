// What the giving form does after each kind of answer to a gift request.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOST_CONNECTION, readGiveReply } from '../src/lib/give-reply.ts';

test('a confirmed gift is done', () => {
  const next = readGiveReply(200, { ok: true, amount: 25, designation: 'Where Most Needed' });
  assert.equal(next.kind, 'done');
});

test('no answer at all keeps the attempt open and never offers a new card window', () => {
  assert.deepEqual(readGiveReply(null, null), { kind: 'unresolved', message: LOST_CONNECTION });
});

test('an answer that is not JSON (a timeout page) keeps the attempt open', () => {
  assert.equal(readGiveReply(524, null).kind, 'unresolved');
});

test('a server error with no retry advice keeps the attempt open', () => {
  assert.equal(readGiveReply(500, { ok: false, message: 'x' }).kind, 'unresolved');
});

test('still processing and unconfirmed keep the attempt open with the server wording', () => {
  const wait = readGiveReply(409, { ok: false, message: 'Your gift is still being processed.', retry: 'wait' });
  assert.deepEqual(wait, { kind: 'unresolved', message: 'Your gift is still being processed.' });
  const none = readGiveReply(502, { ok: false, message: 'Email us.', retry: 'none' });
  assert.deepEqual(none, { kind: 'unresolved', message: 'Email us.' });
});

test('a refused card asks for the card again and says nothing was charged', () => {
  const next = readGiveReply(400, { ok: false, message: 'Declined.', retry: 'new_checkout' });
  assert.equal(next.kind, 'new_checkout');
  assert.match(next.message, /^Declined\. Your card was not charged\. Press the button to enter your card again/);
});

test('a failure before the charge retries the same authorization', () => {
  const next = readGiveReply(400, { ok: false, message: 'Human verification failed; please try again', retry: 'same' });
  assert.equal(next.kind, 'retry_same');
  assert.match(next.message, /Your card was not charged\. Press the button to try again/);
  assert.equal(readGiveReply(400, { ok: false, message: 'Unknown designation' }).kind, 'retry_same');
});

test('a server sentence with no closing period still reads as two sentences', () => {
  const next = readGiveReply(400, { ok: false, message: 'Human verification failed; please try again', retry: 'same' });
  assert.match(next.message, /^Human verification failed; please try again\. Your card was not charged\./);
});
