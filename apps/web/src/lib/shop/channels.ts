import type { ShopLinkChannel, ShopPurchaseLink } from './types';

export const SHOP_LINK_PRESETS: { channel: ShopLinkChannel; label: string }[] = [
  { channel: 'amazon-in', label: 'Amazon India' },
  { channel: 'amazon-uae', label: 'Amazon UAE' },
  { channel: 'publisher', label: 'Publisher' },
  { channel: 'goodreads', label: 'Goodreads' },
  { channel: 'flipkart', label: 'Flipkart' },
];

const CHANNEL_LABELS: Record<ShopLinkChannel, string> = {
  'amazon-in': 'Amazon India',
  'amazon-uae': 'Amazon UAE',
  publisher: 'Publisher',
  goodreads: 'Goodreads',
  flipkart: 'Flipkart',
  other: 'Buy',
};

const CHANNEL_SELLER: Record<ShopLinkChannel, string> = {
  'amazon-in': 'Amazon India',
  'amazon-uae': 'Amazon UAE',
  publisher: 'Publisher',
  goodreads: 'Goodreads',
  flipkart: 'Flipkart',
  other: 'Retailer',
};

/** Subtle button accent per channel (public shop buttons). */
const CHANNEL_BUTTON_CLASS: Record<ShopLinkChannel, string> = {
  'amazon-in': 'bg-terracotta hover:bg-terracotta/90',
  'amazon-uae': 'bg-chai-brown hover:bg-chai-brown/90',
  publisher: 'bg-sage hover:bg-sage/90',
  goodreads: 'bg-cream-light text-chai-brown border border-chai-brown/25 hover:border-terracotta/40',
  flipkart: 'bg-terracotta/85 hover:bg-terracotta',
  other: 'bg-terracotta hover:bg-terracotta/90',
};

export function defaultLabelForChannel(channel: ShopLinkChannel): string {
  return CHANNEL_LABELS[channel] ?? 'Buy';
}

export function sellerNameForChannel(channel: ShopLinkChannel | undefined): string {
  if (!channel) return 'Retailer';
  return CHANNEL_SELLER[channel];
}

export function buttonClassForChannel(channel: ShopLinkChannel | undefined): string {
  const base =
    'inline-flex items-center justify-center gap-2 min-w-[10rem] px-5 py-3 rounded-lg font-sans text-sm font-medium transition-colors';
  if (!channel) return `${base} bg-terracotta text-cream hover:bg-terracotta/90`;
  const accent = CHANNEL_BUTTON_CLASS[channel];
  const text = channel === 'goodreads' ? '' : ' text-cream';
  return `${base} ${accent}${text}`;
}

export function relForChannel(channel: ShopLinkChannel | undefined): string {
  if (channel === 'goodreads') return 'noopener noreferrer';
  return 'noopener noreferrer sponsored';
}

export function presetLink(channel: ShopLinkChannel): ShopPurchaseLink {
  return { channel, label: defaultLabelForChannel(channel), url: '' };
}
