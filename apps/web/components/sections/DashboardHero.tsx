export default function DashboardHero() {
  return (
    <section className="mb-12">

      <div className="mb-6">

       <h1 className="mb-4 text-5xl font-extrabold tracking-tight md:text-6xl">
         <span className="text-blue-600">Market</span>
         <span className="text-slate-900">Pilot</span>
         <span className="text-emerald-500"> AI</span>
       </h1>

        <p className="text-lg text-gray-400 max-w-3xl leading-8">
          Discover the highest-potential Crypto, Stock and ETF investment
          opportunities using transparent AI analysis and real-time market data.
        </p>

      </div>

      <input
        placeholder="Search Bitcoin, NVIDIA, ETF..."
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

    </section>
  )
}