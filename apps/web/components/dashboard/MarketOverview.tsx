type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type MarketOverviewProps = {
  liveCryptoData: LiveCryptoData;
};

const trackedAssets = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    icon: "◆",
  },
  {
    name: "Solana",
    symbol: "SOL",
    icon: "◎",
  },
];

export default function MarketOverview({
  liveCryptoData,
}: MarketOverviewProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Live market
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Market Overview
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Live cryptocurrency prices and 24-hour market movement.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {trackedAssets.map((asset) => {
          const marketData = liveCryptoData[asset.symbol];
          const isNegative =
            marketData?.change24h.startsWith("-") ?? false;

          return (
            <article
              key={asset.symbol}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-700">
                    {asset.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {asset.name}
                    </h3>

                    <p className="text-sm font-medium text-slate-500">
                      {asset.symbol}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Live
                </span>
              </div>

              {marketData ? (
                <>
                  <p className="mt-6 text-2xl font-black text-slate-900">
                    {marketData.currentPrice}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span
                      className={
                        isNegative
                          ? "rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700"
                          : "rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700"
                      }
                    >
                      {isNegative ? "↘" : "↗"}{" "}
                      {marketData.change24h}
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      24 hours
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={
                        isNegative
                          ? "h-full w-2/5 rounded-full bg-red-500"
                          : "h-full w-4/5 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-700">
                    Live price temporarily unavailable
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}