'use client';

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] animate-pulse">
      <div className="aspect-[2/3] rounded-md bg-gray-800" />
      <div className="mt-2 h-4 bg-gray-800 rounded w-3/4" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="px-4 sm:px-6 lg:px-12 mb-8">
      <div className="h-6 bg-gray-800 rounded w-48 mb-4 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative w-full h-[70vh] bg-gray-900 animate-pulse">
      <div className="absolute bottom-20 left-12 space-y-4">
        <div className="h-10 bg-gray-800 rounded w-96" />
        <div className="h-4 bg-gray-800 rounded w-80" />
        <div className="h-4 bg-gray-800 rounded w-64" />
        <div className="flex gap-3 mt-4">
          <div className="h-12 w-32 bg-gray-800 rounded-lg" />
          <div className="h-12 w-40 bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-[#141414] animate-pulse">
      <div className="w-full h-[60vh] bg-gray-900" />
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 space-y-4">
        <div className="h-10 bg-gray-800 rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-5 bg-gray-800 rounded w-20" />
          <div className="h-5 bg-gray-800 rounded w-16" />
          <div className="h-5 bg-gray-800 rounded w-16" />
        </div>
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
        <div className="h-4 bg-gray-800 rounded w-4/6" />
      </div>
    </div>
  );
}
