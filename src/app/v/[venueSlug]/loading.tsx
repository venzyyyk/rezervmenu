export default function VenueMenuLoading() {
  return (
    <div className="px-4 pt-4 pb-32">
      {/* Category nav skeleton */}
      <div className="sticky top-[57px] z-30 bg-surface/80 backdrop-blur border-b border-line -mx-4 px-4 py-3 mb-6">
        <div className="flex gap-2 overflow-hidden">
          {[80, 100, 72, 120, 90, 64].map((w, i) => (
            <div
              key={i}
              className="skeleton shrink-0 h-7 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Секции */}
      {[1, 2].map((s) => (
        <div key={s} className="mb-10">
          <div className="skeleton h-6 w-32 rounded-lg mb-5" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl overflow-hidden">
                <div className="aspect-[4/3]" />
                <div className="p-3.5 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-5 w-20 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
