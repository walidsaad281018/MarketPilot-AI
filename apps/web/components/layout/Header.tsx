export default function Header() {
  return (
    <header className="pt-16 text-center md:pt-24">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        AI-powered market intelligence
      </div>

      <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
        Find stronger market
        <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
          opportunities faster.
        </span>
      </h1>
    </header>
  );
}
