import mongoose, { Document, Schema } from 'mongoose';

export type MessageSource = 'contact' | 'work-with-me';

export interface IMessage extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  service?: string;
  source: MessageSource;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    service: { type: String },
    source: { type: String, required: true, enum: ['contact', 'work-with-me'] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
