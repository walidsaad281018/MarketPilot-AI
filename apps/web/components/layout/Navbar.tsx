import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-6">
      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-lg shadow-blue-900/20">
          M
        </div>

        <div>
          <p className="text-lg font-black tracking-tight text-slate-950">
            MarketPilot
            <span className="text-blue-600"> AI</span>
          </p>

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Investment Intelligence
          </p>
        </div>
      </Link>

      <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
        <Link
          href="/dashboard"
          className="transition hover:text-blue-600"
        >
          Dashboard
        </Link>

        <Link
          href="/opportunities"
          className="transition hover:text-blue-600"
        >
          Opportunities
        </Link>

        <Link
          href="/recommendations"
          className="transition hover:text-blue-600"
        >
          Track Record
        </Link>
      </div>

      <Link
        href="/opportunities"
        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-600"
      >
        Explore opportunities
      </Link>
    </nav>
  );
}
