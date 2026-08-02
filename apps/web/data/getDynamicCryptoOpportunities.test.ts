import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getDynamicCryptoOpportunities,
} from "@/data/getDynamicCryptoOpportunities";
import type {
  LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import {
  cryptoProvider,
  type DiscoveredCryptoMarket,
} from "@/lib/providers/marketProvider";

const {
  getLiveCryptoOpportunitiesMock,
} = vi.hoisted(() => ({
  getLiveCryptoOpportunitiesMock:
    vi.fn(),
}));

vi.mock(
  "@/data/getLiveCryptoOpportunities",
  () => ({
    getLiveCryptoOpportunities:
      getLiveCryptoOpportunitiesMock,
  }),
);

afterEach(() => {
  vi.restoreAllMocks();

  getLiveCryptoOpportunitiesMock
    .mockReset();
});

describe(
  "getDynamicCryptoOpportunities",
  () => {
    it(
      "discovers, deduplicates, scores and ranks crypto markets",
      async () => {
        const discoveredMarkets = [
          createMarket({
            id: "alpha",
            name: "Alpha",
            symbol: "AAA",
            priceChange24h: 8,
            volume24hUsd:
              6_000_000_000,
            marketCapRank: 1,
          }),
          createMarket({
            id: "beta",
            name: "Beta",
            symbol: "BBB",
            priceChange24h: 3,
            volume24hUsd:
              2_000_000_000,
            marketCapRank: 2,
          }),
          createMarket({
            id: "duplicate-alpha",
            name:
              "Duplicate Alpha",
            symbol: "aaa",
            priceChange24h: 20,
            volume24hUsd:
              10_000_000_000,
            marketCapRank: 3,
          }),
          createMarket({
            id: "gamma",
            name: "Gamma",
            symbol: "CCC",
            priceChange24h: -4,
            volume24hUsd:
              500_000_000,
            marketCapRank: 4,
          }),
        ];

        vi.spyOn(
          cryptoProvider,
          "getTopMarkets",
        ).mockResolvedValue(
          discoveredMarkets,
        );

        const result =
          await getDynamicCryptoOpportunities({
            discoveryLimit: 4,
            resultLimit: 3,
          });

        expect(
          cryptoProvider.getTopMarkets,
        ).toHaveBeenCalledOnce();

        expect(
          cryptoProvider.getTopMarkets,
        ).toHaveBeenCalledWith(4);

        expect(result).toHaveLength(
          3,
        );

        expect(
          result.map(
            (opportunity) =>
              opportunity.symbol,
          ),
        ).toHaveLength(
          new Set(
            result.map(
              (opportunity) =>
                opportunity.symbol,
            ),
          ).size,
        );

        expect(
          result.filter(
            (opportunity) =>
              opportunity.symbol ===
              "AAA",
          ),
        ).toHaveLength(1);

        expect(
          result.map(
            (opportunity) =>
              opportunity.rank,
          ),
        ).toEqual([1, 2, 3]);

        expect(
          isSortedByScore(result),
        ).toBe(true);

        expect(
          getLiveCryptoOpportunitiesMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "uses the default discovery and result limits",
      async () => {
        const discoveredMarkets =
          Array.from(
            {
              length: 120,
            },
            (_, index) =>
              createMarket({
                id:
                  `market-${index}`,
                name:
                  `Market ${index}`,
                symbol:
                  `M${index}`,
                priceChange24h:
                  index % 10,
                volume24hUsd:
                  100_000_000 +
                  index *
                    1_000_000,
                marketCapRank:
                  index + 1,
              }),
          );

        vi.spyOn(
          cryptoProvider,
          "getTopMarkets",
        ).mockResolvedValue(
          discoveredMarkets,
        );

        const result =
          await getDynamicCryptoOpportunities();

        expect(
          cryptoProvider.getTopMarkets,
        ).toHaveBeenCalledWith(
          200,
        );

        expect(result).toHaveLength(
          100,
        );

        expect(
          result[0]?.rank,
        ).toBe(1);

        expect(
          result[99]?.rank,
        ).toBe(100);

        expect(
          isSortedByScore(result),
        ).toBe(true);
      },
    );

    it(
      "falls back to the existing live opportunities when discovery fails",
      async () => {
        const fallbackOpportunities = [
          createFallbackOpportunity({
            rank: 4,
            symbol: "BTC",
          }),
          createFallbackOpportunity({
            rank: 8,
            asset: "Ethereum",
            symbol: "ETH",
          }),
        ];

        vi.spyOn(
          cryptoProvider,
          "getTopMarkets",
        ).mockRejectedValue(
          new Error(
            "CoinGecko unavailable.",
          ),
        );

        getLiveCryptoOpportunitiesMock
          .mockResolvedValue(
            fallbackOpportunities,
          );

        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        const result =
          await getDynamicCryptoOpportunities({
            discoveryLimit: 10,
            resultLimit: 2,
          });

        expect(
          getLiveCryptoOpportunitiesMock,
        ).toHaveBeenCalledOnce();

        expect(
          result.map(
            (opportunity) =>
              opportunity.rank,
          ),
        ).toEqual([1, 2]);

        expect(
          result.map(
            (opportunity) =>
              opportunity.symbol,
          ),
        ).toEqual([
          "BTC",
          "ETH",
        ]);

        expect(
          consoleErrorSpy,
        ).toHaveBeenCalled();
      },
    );

    it(
      "uses fallback opportunities when discovery returns no usable markets",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getTopMarkets",
        ).mockResolvedValue([]);

        getLiveCryptoOpportunitiesMock
          .mockResolvedValue([
            createFallbackOpportunity({
              rank: 5,
              symbol: "BTC",
            }),
          ]);

        const result =
          await getDynamicCryptoOpportunities({
            discoveryLimit: 10,
            resultLimit: 1,
          });

        expect(
          getLiveCryptoOpportunitiesMock,
        ).toHaveBeenCalledOnce();

        expect(result).toHaveLength(
          1,
        );

        expect(result[0]).toMatchObject({
          rank: 1,
          symbol: "BTC",
        });
      },
    );

    it(
      "rejects a result limit greater than the discovery limit",
      async () => {
        const providerSpy =
          vi.spyOn(
            cryptoProvider,
            "getTopMarkets",
          );

        await expect(
          getDynamicCryptoOpportunities({
            discoveryLimit: 50,
            resultLimit: 100,
          }),
        ).rejects.toThrow(
          "Result limit cannot exceed the discovery limit.",
        );

        expect(
          providerSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid discovery limits",
      async () => {
        const providerSpy =
          vi.spyOn(
            cryptoProvider,
            "getTopMarkets",
          );

        await expect(
          getDynamicCryptoOpportunities({
            discoveryLimit: 251,
            resultLimit: 100,
          }),
        ).rejects.toThrow(
          "Discovery limit must be an integer between 1 and 250.",
        );

        expect(
          providerSpy,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

function createMarket(
  overrides: Partial<DiscoveredCryptoMarket> = {},
): DiscoveredCryptoMarket {
  return {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    category: "crypto",
    price: 100,
    priceChange24h: 2,
    volume24hUsd:
      1_000_000_000,
    volatility24h: 3.9,
    marketCapUsd:
      2_000_000_000,
    marketCapRank: 1,
    lastUpdated:
      "2026-07-23T00:00:00.000Z",
    source: "CoinGecko",
    ...overrides,
  };
}

function createFallbackOpportunity(
  overrides: Partial<LiveCryptoOpportunity> = {},
): LiveCryptoOpportunity {
  return {
    rank: 1,
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    score: 85,
    expectedReturn: "+10.20%",
    risk: "Medium",
    confidence: 82,
    trend: "Bullish",
    historicalAccuracy: 84,
    currentPriceUsd: 100,
    priceChange24h: 2,
    volatility24h: 3.9,
    volume24hUsd:
      1_000_000_000,
    dataSource: "fallback",
    source: "MarketPilot Demo",
    lastUpdated: null,
    isStale: false,
    ...overrides,
  };
}

function isSortedByScore(
  opportunities:
    LiveCryptoOpportunity[],
): boolean {
  return opportunities.every(
    (
      opportunity,
      index,
    ) => {
      const nextOpportunity =
        opportunities[index + 1];

      return (
        nextOpportunity ===
          undefined ||
        opportunity.score >=
          nextOpportunity.score
      );
    },
  );
}
