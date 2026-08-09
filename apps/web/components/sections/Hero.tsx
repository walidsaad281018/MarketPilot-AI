import Link from "next/link";

export default function Hero() {
  return (
    <section className="pb-10 text-center">
      <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
        MarketPilot turns live market data into transparent,
        ranked opportunities using scoring, market quality,
        risk and historical performance signals.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/opportunities"
          className="inline-flex min-w-52 items-center justify-center rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Explore Top Picks →
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex min-w-52 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        >
          Open Dashboard
        </Link>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        <TrustSignal
          value="Live"
          label="Market data"
        />

        <TrustSignal
          value="100-point"
          label="Transparent scoring"
        />

        <TrustSignal
          value="Tracked"
          label="Recommendation results"
        />
      </div>
    </section>
  );
}

function TrustSignal({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <p className="font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}
