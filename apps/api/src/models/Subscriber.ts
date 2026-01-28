import mongoose, { Document, Schema } from 'mongoose';

export type SubscriberStatus = 'subscribed' | 'unsubscribed';

export interface ISubscriber extends Document {
  email: string;
  name?: string;
  status: SubscriberStatus;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed'],
      default: 'subscribed',
    },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
    source: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
