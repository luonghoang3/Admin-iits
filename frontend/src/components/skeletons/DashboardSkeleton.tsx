'use client';

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-40 bg-gray-200 rounded-md dark:bg-gray-700"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-md dark:bg-gray-700"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="h-6 w-48 bg-gray-200 rounded-md mt-2 dark:bg-gray-700"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
        ))}
      </div>

      {/* Order charts skeleton */}
      <div className="h-6 w-48 bg-gray-200 rounded-md mt-4 dark:bg-gray-700"></div>
      <div className="flex flex-col md:flex-row gap-5 h-[500px]">
        <div className="w-full md:w-[60%] h-full bg-gray-200 rounded-lg dark:bg-gray-700"></div>
        <div className="w-full md:w-[40%] h-full bg-gray-200 rounded-lg dark:bg-gray-700"></div>
      </div>

      {/* Invoice charts skeleton */}
      <div className="h-6 w-64 bg-gray-200 rounded-md mt-8 dark:bg-gray-700"></div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-[500px] bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* Bottom section skeleton */}
      <div className="flex flex-col md:flex-row gap-5 mt-8">
        <div className="w-full md:w-[35%] h-[400px] bg-gray-200 rounded-lg dark:bg-gray-700"></div>
        <div className="w-full md:w-[65%] h-[400px] bg-gray-200 rounded-lg dark:bg-gray-700"></div>
      </div>
    </div>
  );
}
