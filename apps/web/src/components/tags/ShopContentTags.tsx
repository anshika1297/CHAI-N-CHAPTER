import ContentTagList from './ContentTagList';

/** Inherited tags from parent editorial content on shop pages. */
export default function ShopContentTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="site-container max-w-5xl mb-6">
      <ContentTagList tags={tags} heading="Related tags" />
    </div>
  );
}
