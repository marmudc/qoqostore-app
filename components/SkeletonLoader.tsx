export default function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full animate-pulse">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="bg-[#151822] rounded-3xl border border-gray-800/80 overflow-hidden flex flex-col h-[320px]">
          {/* Kotak Gambar Placeholder */}
          <div className="w-full h-[180px] bg-gray-800/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
          </div>
          
          {/* Kotak Teks Placeholder */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-5 bg-gray-800/80 rounded-lg w-3/4"></div>
              <div className="h-3.5 bg-gray-800/50 rounded-lg w-full"></div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-800/40">
              <div className="h-6 bg-gray-800/80 rounded-md w-24"></div>
              <div className="h-9 bg-gray-800/80 rounded-xl w-28"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}