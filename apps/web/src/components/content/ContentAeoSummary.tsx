/** AI / GEO / AEO-friendly Q&A summary block (semantic `<dl>`). */

export type AeoPair = { question: string; answer: string };

type Props = {
  pairs: AeoPair[];
  heading?: string;
  className?: string;
};

function AeoAnswer({ text }: { text: string }) {
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return (
      <dd
        className="font-body text-sm sm:text-base text-chai-brown-light leading-relaxed blog-content"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <dd className="font-body text-sm sm:text-base text-chai-brown-light leading-relaxed">{text}</dd>;
}

export default function ContentAeoSummary({ pairs, heading = 'At a glance', className = '' }: Props) {
  const valid = pairs.filter((p) => p.question.trim() && p.answer.trim());
  if (!valid.length) return null;

  return (
    <section
      className={`mb-8 sm:mb-10 bg-cream-light rounded-2xl border border-chai-brown/10 p-5 sm:p-6 ${className}`}
      aria-labelledby="content-aeo-summary"
      data-aeo-summary="true"
    >
      <h2 id="content-aeo-summary" className="font-serif text-lg sm:text-xl text-chai-brown mb-4">
        {heading}
      </h2>
      <dl className="space-y-4">
        {valid.map((item) => (
          <div key={item.question}>
            <dt className="font-sans text-sm sm:text-base font-semibold text-chai-brown mb-1">{item.question}</dt>
            <AeoAnswer text={item.answer} />
          </div>
        ))}
      </dl>
    </section>
  );
}
