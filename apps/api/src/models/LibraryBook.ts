import mongoose, { Document, Schema } from 'mongoose';
import {
  BOOK_FORMATS,
  BookFormat,
  DISCOVERY_SOURCES,
  DISCOVERY_STATUSES,
  DiscoverySource,
  DiscoveryStatus,
  OWNERSHIP_STATUSES,
  OwnershipStatus,
  READING_STATUSES,
  RECOMMENDATION_CONFIDENCE,
  ReadingStatus,
  RecommendationConfidence,
} from '../config/libraryEnums.js';

// Excel schema enums (authorGender, fictionType, womenFocus) stored as trimmed strings
// — see libraryExcelSchema.ts / libraryEnums AUTHOR_GENDERS, FICTION_TYPES, WOMEN_FOCUS_VALUES.
/** A single time the admin recommended this book (§6 Recommendation History). */
export interface IRecommendationEntry {
  date: Date;
  channel?: string;
  note?: string;
  contentUrl?: string;
}

/**
 * A physical or digital copy the admin owns (e.g. paperback in India, Kindle).
 * A book can have several copies across formats and locations.
 */
export interface IBookCopy {
  format?: BookFormat;
  location?: string;
  notes?: string;
}

/** Where the book links out to across platforms (§6 Content Links). */
export interface IBookContentLinks {
  goodreads?: string;
  amazon?: string;
  blog?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  newsletter?: string;
}

/**
 * Master profile for a book in the admin's personal Library OS (§6).
 * This is intentionally separate from the public `Book` catalog (auto-synced
 * from site content) so the personal library and the website never collide.
 */
export interface ILibraryBook extends Document {
  // Basic
  title: string;
  slug: string;
  subtitle?: string;
  coverImage?: string;
  isbn?: string;
  asin?: string;
  format?: BookFormat;
  pages?: number;
  publicationDate?: Date;
  originalPublicationDate?: Date;
  edition?: string;
  description?: string;

  // Relationships
  author: string;
  authorSlug?: string;
  /** Excel: Author Gender */
  authorGender?: string;
  series?: string;
  seriesNumber?: number;
  /** Excel: Series (Yes/No) — book is part of a series */
  inSeries?: boolean;
  /** Excel: Standalone */
  standalone?: boolean;
  publisher?: string;
  country?: string;
  originalLanguage?: string;
  translator?: string;

  // Reading
  status: ReadingStatus;
  rating?: number;
  recommendationConfidence?: RecommendationConfidence;
  ownership?: OwnershipStatus;
  /** Excel: Owned (Yes/No) */
  owned?: boolean;
  /** Excel: Wishlist — Yes or free-text shelf/signal labels */
  wishlist?: string;
  /** Owned copies across formats/locations (paperback in India, Kindle, etc.). */
  copies: IBookCopy[];
  location?: string;
  startedDate?: Date;
  finishedDate?: Date;
  /** When the book was first added to the shelf (e.g. Goodreads "Date Added"). */
  addedDate?: Date;
  rereadCount: number;

  // Classification — Excel-first
  /** Excel: Fiction / Non-fiction */
  fictionType?: string;
  /** Excel: Primary Genre */
  primaryGenre?: string;
  /** Excel: Secondary Genre */
  secondaryGenre?: string;
  genres: string[];
  subgenres: string[];
  themes: string[];
  tropes: string[];
  moods: string[];
  keywords: string[];
  tags: string[];
  audience?: string;
  readingLevel?: string;
  writingStyle?: string;
  triggerWarnings: string[];
  /** Excel: Female Author */
  femaleAuthor?: boolean;
  /** Excel: Female Protagonist */
  femaleProtagonist?: boolean;
  /** Excel: Women Focus (No / Primary / Secondary / Yes) */
  womenFocus?: string;

  // Personal / content planning (Excel)
  oneLineRecommendation?: string;
  personalNotes?: string;
  favouriteCharacter?: string;
  favouriteQuote?: string;
  favouriteScene?: string;
  similarBooks: string[];
  whyIRecommendIt?: string;
  /** Excel: Recommendation Occasion */
  seasonalRecommendation: string[];
  /** Excel: Instagram Hook */
  instagramHook?: string;
  /** Excel: Instagram Post Topic */
  instagramPostTopic?: string;
  /** Excel: Best Posting Month */
  bestPostingMonth?: string;
  /** Excel: Awards */
  awards: string[];
  /** Excel: Bestseller (Yes/No or popularity / notes) */
  bestseller?: string;
  /** Excel: Adaptation (Yes/No or adaptation notes / popularity) */
  adaptation?: string;
  /** Excel: BookTok Popular (Yes/No or High/Moderate/…) */
  bookTokPopular?: string;
  /** Excel: Bookstagram Popular (Yes/No or High/Moderate/…) */
  bookstagramPopular?: string;

  // Discovery (§10)
  discoverySource?: DiscoverySource;
  discoveryStatus?: DiscoveryStatus;

  // Collections membership (names from taxonomy type 'collection')
  collections: string[];

  // Content links + recommendation history
  contentLinks?: IBookContentLinks;
  recommendationHistory: IRecommendationEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const RecommendationEntrySchema = new Schema<IRecommendationEntry>(
  {
    date: { type: Date, required: true },
    channel: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
    contentUrl: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const BookCopySchema = new Schema<IBookCopy>(
  {
    format: { type: String, enum: [...BOOK_FORMATS, ''], default: '' },
    location: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const ContentLinksSchema = new Schema<IBookContentLinks>(
  {
    goodreads: { type: String, default: '', trim: true },
    amazon: { type: String, default: '', trim: true },
    blog: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    linkedin: { type: String, default: '', trim: true },
    youtube: { type: String, default: '', trim: true },
    newsletter: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const LibraryBookSchema = new Schema<ILibraryBook>(
  {
    // Basic
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    subtitle: { type: String, default: '', trim: true },
    coverImage: { type: String, default: '' },
    isbn: { type: String, default: '', trim: true },
    asin: { type: String, default: '', trim: true },
    format: { type: String, enum: [...BOOK_FORMATS, ''], default: '' },
    pages: { type: Number, min: 0 },
    publicationDate: { type: Date },
    originalPublicationDate: { type: Date },
    edition: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },

    // Relationships
    author: { type: String, default: '', trim: true },
    authorSlug: { type: String, default: '', trim: true, lowercase: true },
    authorGender: { type: String, default: '', trim: true },
    series: { type: String, default: '', trim: true },
    seriesNumber: { type: Number },
    inSeries: { type: Boolean },
    standalone: { type: Boolean },
    publisher: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    originalLanguage: { type: String, default: '', trim: true },
    translator: { type: String, default: '', trim: true },

    // Reading
    status: { type: String, enum: READING_STATUSES, default: 'want-to-read', index: true },
    rating: { type: Number, min: 0, max: 5 },
    recommendationConfidence: { type: String, enum: [...RECOMMENDATION_CONFIDENCE, ''], default: '' },
    ownership: { type: String, enum: [...OWNERSHIP_STATUSES, ''], default: '' },
    owned: { type: Boolean },
    wishlist: { type: String, default: '', trim: true },
    copies: { type: [BookCopySchema], default: [] },
    location: { type: String, default: '', trim: true },
    startedDate: { type: Date },
    finishedDate: { type: Date },
    addedDate: { type: Date },
    rereadCount: { type: Number, default: 0, min: 0 },

    // Classification
    fictionType: { type: String, default: '', trim: true, index: true },
    primaryGenre: { type: String, default: '', trim: true },
    secondaryGenre: { type: String, default: '', trim: true },
    genres: { type: [String], default: [] },
    subgenres: { type: [String], default: [] },
    themes: { type: [String], default: [] },
    tropes: { type: [String], default: [] },
    moods: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    audience: { type: String, default: '', trim: true },
    readingLevel: { type: String, default: '', trim: true },
    writingStyle: { type: String, default: '', trim: true },
    triggerWarnings: { type: [String], default: [] },
    femaleAuthor: { type: Boolean, index: true },
    femaleProtagonist: { type: Boolean, index: true },
    womenFocus: { type: String, default: '', trim: true, index: true },

    // Personal / content planning
    oneLineRecommendation: { type: String, default: '', trim: true },
    personalNotes: { type: String, default: '', trim: true },
    favouriteCharacter: { type: String, default: '', trim: true },
    favouriteQuote: { type: String, default: '', trim: true },
    favouriteScene: { type: String, default: '', trim: true },
    similarBooks: { type: [String], default: [] },
    whyIRecommendIt: { type: String, default: '', trim: true },
    seasonalRecommendation: { type: [String], default: [] },
    instagramHook: { type: String, default: '', trim: true },
    instagramPostTopic: { type: String, default: '', trim: true },
    bestPostingMonth: { type: String, default: '', trim: true },
    awards: { type: [String], default: [] },
    bestseller: { type: String, default: '', trim: true, index: true },
    adaptation: { type: String, default: '', trim: true },
    bookTokPopular: { type: String, default: '', trim: true, index: true },
    bookstagramPopular: { type: String, default: '', trim: true, index: true },

    // Discovery
    discoverySource: { type: String, enum: [...DISCOVERY_SOURCES, ''], default: '' },
    discoveryStatus: { type: String, enum: [...DISCOVERY_STATUSES, ''], default: '' },

    // Collections
    collections: { type: [String], default: [] },

    // Links + history
    contentLinks: { type: ContentLinksSchema, default: undefined },
    recommendationHistory: { type: [RecommendationEntrySchema], default: [] },
  },
  { timestamps: true }
);

LibraryBookSchema.index({ title: 'text', author: 'text', description: 'text', personalNotes: 'text' });
LibraryBookSchema.index({ author: 1 });
LibraryBookSchema.index({ authorSlug: 1 });
LibraryBookSchema.index({ genres: 1 });
LibraryBookSchema.index({ themes: 1 });
LibraryBookSchema.index({ moods: 1 });
LibraryBookSchema.index({ tropes: 1 });
LibraryBookSchema.index({ tags: 1 });
LibraryBookSchema.index({ pages: 1 });
LibraryBookSchema.index({ rating: -1 });
LibraryBookSchema.index({ createdAt: -1 });
LibraryBookSchema.index({ finishedDate: -1 });
LibraryBookSchema.index({ 'copies.location': 1 });
LibraryBookSchema.index({ 'copies.format': 1 });

export const LibraryBook = mongoose.model<ILibraryBook>('LibraryBook', LibraryBookSchema);
