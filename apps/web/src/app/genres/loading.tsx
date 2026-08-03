export default function GenresLoading() {
  return (
    <main className="pt-28 pb-16 min-h-screen">
      <div className="site-container animate-pulse">
        <div className="h-10 w-64 bg-chai-brown/10 rounded mx-auto mb-4" />
        <div className="h-5 w-full max-w-xl bg-chai-brown/10 rounded mx-auto mb-10" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-chai-brown/10 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
