import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 py-10">
      <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
        <div>
          <p className="font-black text-slate-900">
            MarketPilot
            <span className="text-blue-600"> AI</span>
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Analyze. Understand. Invest.
          </p>
        </div>

        <div className="flex gap-6 text-sm font-medium text-slate-500">
          <Link
            href="/opportunities"
            className="hover:text-blue-600"
          >
            Opportunities
          </Link>

          <Link
            href="/dashboard"
            className="hover:text-blue-600"
          >
            Dashboard
          </Link>
        </div>

        <p className="text-sm text-slate-400">
          © 2026 MarketPilot AI
        </p>
      </div>
    </footer>
  );
}
