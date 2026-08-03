import Link from 'next/link';
import type { ReactNode } from 'react';

export function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (isInternalPath(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="section-heading text-2xl sm:text-3xl scroll-mt-28 break-words">
      {children}
    </h2>
  );
}

/** Render HTML when tags are present; otherwise plain text with pre-wrap. */
export function RichOrPlain({
  html,
  plain,
  className = '',
  as: Tag = 'div',
}: {
  html?: string;
  plain?: string;
  className?: string;
  as?: 'div' | 'p';
}) {
  const text = plain ?? html ?? '';
  if (html && /<[a-z][\s\S]*>/i.test(html)) {
    return (
      <Tag
        className={`blog-content text-chai-brown/90 leading-relaxed max-w-full break-words ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (text.trim()) {
    return (
      <Tag className={`font-body text-base text-chai-brown/90 leading-relaxed whitespace-pre-wrap ${className}`.trim()}>
        {text}
      </Tag>
    );
  }
  return null;
}
