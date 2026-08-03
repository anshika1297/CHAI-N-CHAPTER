import { buildMetadata } from '@/lib/metadata';
import { resolveShopHubMetadata } from '@/lib/metadata/shop';
import { getShopHubEntries } from '@/lib/shopCatalog';
import ShopHubView from '@/components/shop/ShopHubView';
import ShopAffiliateNote from '@/components/shop/ShopAffiliateNote';

export const revalidate = 60;

export const metadata = buildMetadata(resolveShopHubMetadata());

export default async function ShopPage() {
  const entries = await getShopHubEntries();
  return (
    <main className="pt-28 pb-16 min-h-screen">
      <div className="site-container">
        <ShopHubView entries={entries} />
        <div className="mt-8"><ShopAffiliateNote /></div>
      </div>
    </main>
  );
}
