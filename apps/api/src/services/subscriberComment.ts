import { Subscriber } from '../models/Subscriber.js';
import {
  signSubscriberToken,
  subscriberDisplayName,
  verifySubscriberToken,
} from '../utils/subscriberToken.js';

export async function issueSubscriberCommentToken(email: string): Promise<{
  commentToken: string;
  name: string;
  email: string;
} | null> {
  const normalized = email.trim().toLowerCase();
  const sub = await Subscriber.findOne({ email: normalized, status: 'subscribed' }).lean();
  if (!sub) return null;
  const name = subscriberDisplayName({ name: sub.name, email: sub.email });
  return {
    commentToken: signSubscriberToken(sub.email, name),
    name,
    email: sub.email,
  };
}

export async function resolveSubscriberForComment(
  token: string
): Promise<{ name: string; email: string } | null> {
  const payload = verifySubscriberToken(token);
  if (!payload) return null;
  const sub = await Subscriber.findOne({ email: payload.email, status: 'subscribed' }).lean();
  if (!sub) return null;
  return {
    name: subscriberDisplayName({ name: sub.name ?? payload.name, email: sub.email }),
    email: sub.email,
  };
}
