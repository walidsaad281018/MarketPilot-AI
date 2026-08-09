import Navbar from "../components/layout/Navbar";
import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import TopOpportunities from "../components/sections/TopOpportunities";
import Button from "../components/ui/Button";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[680px] bg-gradient-to-b from-blue-50 via-indigo-50/50 to-transparent" />

      <div className="pointer-events-none absolute left-1/2 top-10 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <Navbar />

        <Header />

        <Hero />

        <TopOpportunities />

        <section className="my-16 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-7 py-10 text-center text-white shadow-2xl md:px-12 md:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            MarketPilot Intelligence
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
            Don&apos;t chase markets.
            Rank the opportunities.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
            Compare opportunities using transparent signals
            designed to make market analysis faster and easier
            to understand.
          </p>

          <div className="mt-8">
            <Button
              text="View Top 20 Opportunities →"
              href="/opportunities"
            />
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
