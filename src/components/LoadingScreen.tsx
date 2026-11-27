export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-navy">
      {/* Logo */}
      <div className="flex items-center gap-3 animate-fade-in">
        <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand text-[28px] font-extrabold text-navy">
          K
        </span>
        <span className="text-3xl font-extrabold text-white">KaPOS</span>
      </div>

      {/* Spinner */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-brand" />
      </div>

      <p className="text-sm text-[#c9ccd6] animate-pulse">Loading…</p>
    </div>
  )
}
