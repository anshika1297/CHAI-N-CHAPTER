import mongoose, { Document, Schema } from 'mongoose';

export const VISITOR_STATS_SINGLETON_ID = 'site';

export interface IVisitorStats extends Document {
  _id: string;
  totalVisitors: number;
  monthlyVisitors: number;
  currentMonth: string; // e.g. "2025-01"
  updatedAt: Date;
}

const VisitorStatsSchema = new Schema<IVisitorStats>(
  {
    _id: { type: String, default: VISITOR_STATS_SINGLETON_ID },
    totalVisitors: { type: Number, default: 0 },
    monthlyVisitors: { type: Number, default: 0 },
    currentMonth: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

export const VisitorStats = mongoose.model<IVisitorStats>('VisitorStats', VisitorStatsSchema);
