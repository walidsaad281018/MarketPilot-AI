import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getLiveCryptoOpportunities,
} from "@/data/getLiveCryptoOpportunities";
import {
  cryptoOpportunities,
} from "@/data/opportunities";
import {
  cryptoProvider,
  type MarketQuote,
} from "@/lib/providers/marketProvider";

afterEach(() => {
  vi.restoreAllMocks();
});

describe(
  "getLiveCryptoOpportunities",
  () => {
    it(
      "requests quotes for the configured crypto assets",
      async () => {
        const providerSpy =
          vi.spyOn(
            cryptoProvider,
            "getQuotes",
          ).mockResolvedValue([
            createQuote({
              symbol: "BTC",
            }),
          ]);

        await getLiveCryptoOpportunities();

        expect(
          providerSpy,
        ).toHaveBeenCalledOnce();

        const requestedSymbols =
          providerSpy.mock.calls[0]?.[0];

        expect(
          requestedSymbols,
        ).toHaveLength(20);

        expect(
          requestedSymbols,
        ).toEqual(
          expect.arrayContaining([
            "BTC",
            "ETH",
            "SOL",
            "LINK",
            "RENDER",
            "SEI",
          ]),
        );
      },
    );

    it(
      "builds, sorts and ranks opportunities from live quotes",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getQuotes",
        ).mockResolvedValue([
          createQuote({
            symbol: "BTC",
            price: 60_000,
            priceChange24h: 1,
            volume24hUsd:
              2_000_000_000,
            volatility24h: 3,
          }),
          createQuote({
            symbol: "ETH",
            price: 3_000,
            priceChange24h: 8,
            volume24hUsd:
              6_000_000_000,
            volatility24h: 4,
          }),
        ]);

        const result =
          await getLiveCryptoOpportunities();

        expect(result).toHaveLength(2);

        expect(
          result.map(
            (opportunity) =>
              opportunity.rank,
          ),
        ).toEqual([1, 2]);

        expect(
          result[0],
        ).toMatchObject({
          asset: "Ethereum",
          symbol: "ETH",
          currentPriceUsd: 3_000,
        });

        expect(
          result[1],
        ).toMatchObject({
          asset: "Bitcoin",
          symbol: "BTC",
          currentPriceUsd: 60_000,
        });

        expect(
          result[0]?.score,
        ).toBeGreaterThanOrEqual(
          result[1]?.score ?? 0,
        );
      },
    );

    it(
      "normalizes provider symbols when matching quotes",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getQuotes",
        ).mockResolvedValue([
          createQuote({
            symbol: " btc ",
          }),
        ]);

        const result =
          await getLiveCryptoOpportunities();

        expect(result).toHaveLength(1);

        expect(result[0]).toMatchObject({
          asset: "Bitcoin",
          symbol: "BTC",
        });
      },
    );

    it(
      "returns demonstration opportunities when no quotes are available",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getQuotes",
        ).mockResolvedValue([]);

        const result =
          await getLiveCryptoOpportunities();

        expect(result).toHaveLength(
          cryptoOpportunities.length,
        );

        expect(
          result.every(
            (opportunity) =>
              opportunity
                .currentPriceUsd ===
              null,
          ),
        ).toBe(true);

        expect(
          result.map(
            (opportunity) =>
              opportunity.symbol,
          ),
        ).toEqual(
          cryptoOpportunities.map(
            (opportunity) =>
              opportunity.symbol,
          ),
        );
      },
    );

    it(
      "returns demonstration opportunities when the provider fails",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getQuotes",
        ).mockRejectedValue(
          new Error(
            "CoinGecko unavailable.",
          ),
        );

        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        const result =
          await getLiveCryptoOpportunities();

        expect(result).toHaveLength(
          cryptoOpportunities.length,
        );

        expect(
          consoleErrorSpy,
        ).toHaveBeenCalledWith(
          "Unable to build live crypto opportunities:",
          expect.any(Error),
        );
      },
    );

    it(
      "returns demonstration opportunities when a quote contains an invalid price",
      async () => {
        vi.spyOn(
          cryptoProvider,
          "getQuotes",
        ).mockResolvedValue([
          createQuote({
            symbol: "BTC",
            price: 0,
          }),
        ]);

        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        const result =
          await getLiveCryptoOpportunities();

        expect(result).toHaveLength(
          cryptoOpportunities.length,
        );

        expect(
          result[0]?.currentPriceUsd,
        ).toBeNull();

        expect(
          consoleErrorSpy,
        ).toHaveBeenCalled();
      },
    );
  },
);

function createQuote(
  overrides: Partial<MarketQuote> = {},
): MarketQuote {
  return {
    symbol: "BTC",
    category: "crypto",
    price: 100,
    priceChange24h: 3,
    volume24hUsd:
      1_000_000_000,
    volatility24h: 4,
    marketCapUsd:
      2_000_000_000,
    lastUpdated:
      "2026-08-01T00:00:00.000Z",
    source: "CoinGecko",
    ...overrides,
  };
}
