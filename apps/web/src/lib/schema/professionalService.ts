import { siteConfig } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl } from './utils';
import type { JsonLdObject, ProfessionalServiceInput } from './types';

export function buildProfessionalServiceSchema(input: ProfessionalServiceInput): JsonLdObject {
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'ProfessionalService',
    name: input.name,
    url: pageUrl(input.path),
    description: input.description,
    provider: {
      '@type': 'Person',
      name: input.providerName || siteConfig.author,
      url: pageUrl('/about'),
    },
    areaServed: ['IN', 'AE', 'Worldwide'],
    serviceType: input.serviceTypes.filter(Boolean),
  });
}
