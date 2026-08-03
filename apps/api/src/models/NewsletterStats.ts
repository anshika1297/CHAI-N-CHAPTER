import mongoose, { Document, Schema } from 'mongoose';

export const NEWSLETTER_STATS_SINGLETON_ID = 'site';

export type NewsletterPlacementCounts = {
  impressions: number;
  submits: number;
  successes: number;
};

export interface INewsletterStats extends Omit<Document, '_id'> {
  _id: string;
  totals: NewsletterPlacementCounts;
  byPlacement: Record<string, NewsletterPlacementCounts>;
}

const PlacementCountsSchema = new Schema<NewsletterPlacementCounts>(
  {
    impressions: { type: Number, default: 0 },
    submits: { type: Number, default: 0 },
    successes: { type: Number, default: 0 },
  },
  { _id: false }
);

const NewsletterStatsSchema = new Schema<INewsletterStats>(
  {
    _id: { type: String, default: NEWSLETTER_STATS_SINGLETON_ID },
    totals: { type: PlacementCountsSchema, default: () => ({ impressions: 0, submits: 0, successes: 0 }) },
    byPlacement: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, _id: true }
);

export const NewsletterStats = mongoose.model<INewsletterStats>('NewsletterStats', NewsletterStatsSchema);
