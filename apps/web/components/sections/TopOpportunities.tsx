import OpportunityCard from "../cards/OpportunityCard";
import SectionTitle from "../ui/SectionTitle";

export default function TopOpportunities() {
  return (
    <section>

      <SectionTitle title="Today's Top Investment Opportunities" />

      <div className="grid gap-6 md:grid-cols-3">

        <OpportunityCard
          category="🥇 Crypto"
          asset="Bitcoin"
          score={94}
        />

        <OpportunityCard
          category="📈 Stock"
          asset="NVIDIA"
          score={91}
        />

        <OpportunityCard
          category="📊 ETF"
          asset="Vanguard S&P 500 ETF"
          score={89}
        />

      </div>

    </section>
  );
}