export function ShopCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
      <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WishlistSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
