export default function BooksDirectoryLoading() {
  return (
    <main className="pt-28 pb-16 min-h-screen">
      <div className="site-container">
        <div className="text-center mb-10 max-w-3xl mx-auto animate-pulse">
          <div className="h-4 w-32 bg-chai-brown/10 rounded mx-auto mb-4" />
          <div className="h-10 w-full max-w-lg bg-chai-brown/10 rounded mx-auto mb-4" />
          <div className="h-5 w-full max-w-md bg-chai-brown/10 rounded mx-auto" />
        </div>
        <div className="h-12 bg-chai-brown/10 rounded-xl mb-6 animate-pulse" />
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-chai-brown/10 rounded-t-xl" />
              <div className="p-4 space-y-2 bg-cream-light rounded-b-xl border border-chai-brown/10">
                <div className="h-4 bg-chai-brown/10 rounded w-3/4" />
                <div className="h-3 bg-chai-brown/10 rounded w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
