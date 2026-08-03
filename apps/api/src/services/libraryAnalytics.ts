import { LibraryBook } from '../models/LibraryBook.js';

export type LibraryAnalytics = {
  finishedByYear: { year: number; count: number }[];
  finishedThisYearByMonth: { month: number; label: string; count: number }[];
  genreMix: { name: string; count: number }[];
  recommendationByGenre: { name: string; times: number; books: number }[];
  recommendationByChannel: { name: string; count: number }[];
  discoveryByStatus: { name: string; count: number }[];
  discoveryBySource: { name: string; count: number }[];
  totals: {
    finishedThisYear: number;
    recommendationsThisYear: number;
    discoveryPipeline: number;
  };
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Light Library OS analytics for the literary strategist dashboard.
 */
export async function buildLibraryAnalytics(): Promise<LibraryAnalytics> {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [
    finishedByYearAgg,
    finishedThisYearByMonthAgg,
    genreMixAgg,
    recByGenreAgg,
    recByChannelAgg,
    discoveryStatusAgg,
    discoverySourceAgg,
    finishedThisYear,
    recommendationsThisYear,
    discoveryPipeline,
  ] = await Promise.all([
    LibraryBook.aggregate([
      { $match: { finishedDate: { $exists: true, $ne: null } } },
      { $group: { _id: { $year: '$finishedDate' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
    LibraryBook.aggregate([
      { $match: { finishedDate: { $gte: yearStart } } },
      { $group: { _id: { $month: '$finishedDate' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    LibraryBook.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    LibraryBook.aggregate([
      { $match: { 'recommendationHistory.0': { $exists: true }, genres: { $exists: true, $ne: [] } } },
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          times: { $sum: { $size: { $ifNull: ['$recommendationHistory', []] } } },
          books: { $sum: 1 },
        },
      },
      { $sort: { times: -1 } },
      { $limit: 12 },
    ]),
    LibraryBook.aggregate([
      { $unwind: '$recommendationHistory' },
      {
        $group: {
          _id: { $ifNull: ['$recommendationHistory.channel', 'other'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    LibraryBook.aggregate([
      { $match: { discoveryStatus: { $nin: ['', null] } } },
      { $group: { _id: '$discoveryStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    LibraryBook.aggregate([
      { $match: { discoverySource: { $nin: ['', null] } } },
      { $group: { _id: '$discoverySource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    LibraryBook.countDocuments({ finishedDate: { $gte: yearStart } }),
    LibraryBook.countDocuments({
      recommendationHistory: { $elemMatch: { date: { $gte: yearStart } } },
    }),
    LibraryBook.countDocuments({
      discoveryStatus: { $in: ['seen', 'interested', 'must-buy', 'must-read', 'someday'] },
    }),
  ]);

  const monthMap = new Map<number, number>();
  for (const row of finishedThisYearByMonthAgg as { _id: number; count: number }[]) {
    monthMap.set(row._id, row.count);
  }
  const finishedThisYearByMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_LABELS[i],
    count: monthMap.get(i + 1) ?? 0,
  }));

  return {
    finishedByYear: (finishedByYearAgg as { _id: number; count: number }[])
      .filter((r) => r._id)
      .map((r) => ({ year: r._id, count: r.count })),
    finishedThisYearByMonth,
    genreMix: (genreMixAgg as { _id: string; count: number }[]).map((g) => ({
      name: g._id,
      count: g.count,
    })),
    recommendationByGenre: (recByGenreAgg as { _id: string; times: number; books: number }[]).map(
      (g) => ({ name: g._id, times: g.times, books: g.books })
    ),
    recommendationByChannel: (recByChannelAgg as { _id: string; count: number }[]).map((c) => ({
      name: c._id || 'other',
      count: c.count,
    })),
    discoveryByStatus: (discoveryStatusAgg as { _id: string; count: number }[]).map((d) => ({
      name: d._id,
      count: d.count,
    })),
    discoveryBySource: (discoverySourceAgg as { _id: string; count: number }[]).map((d) => ({
      name: d._id,
      count: d.count,
    })),
    totals: {
      finishedThisYear,
      recommendationsThisYear,
      discoveryPipeline,
    },
  };
}
