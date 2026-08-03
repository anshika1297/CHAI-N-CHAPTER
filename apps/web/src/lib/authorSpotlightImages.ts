/** Card/listing image — falls back to author photo for older spotlights. */
export function spotlightCoverImage(spotlight: {
  coverImage?: string;
  profileImage: string;
}): string {
  const cover = spotlight.coverImage?.trim();
  return cover || spotlight.profileImage;
}
