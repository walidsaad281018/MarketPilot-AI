import Navbar from "../components/layout/Navbar";
import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import TopOpportunities from "../components/sections/TopOpportunities";
import Button from "../components/ui/Button";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6">
        <Navbar />

        <Header />

        <Hero />

        <TopOpportunities />

        <div className="mt-10 text-center">
          <Button
            text="View Top 20 Opportunities"
            href="/opportunities"
          />
        </div>

        <Footer />
      </div>
    </main>
  );
}