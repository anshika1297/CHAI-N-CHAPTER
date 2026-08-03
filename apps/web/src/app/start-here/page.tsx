import { buildMetadata, resolveStartHereMetadata } from '@/lib/metadata';
import PageJsonLd from '@/components/schema/PageJsonLd';
import StartHerePageContent from '@/components/start-here/StartHerePageContent';
import { buildStartHereSchemas, fetchStartHereContent } from '@/lib/startHereContent';

export const revalidate = 60;

export const metadata = buildMetadata(resolveStartHereMetadata());

export default async function StartHerePage() {
  const content = await fetchStartHereContent();
  const schemas = buildStartHereSchemas(content);

  return (
    <>
      <PageJsonLd schemas={schemas} />
      <StartHerePageContent content={content} />
    </>
  );
}
