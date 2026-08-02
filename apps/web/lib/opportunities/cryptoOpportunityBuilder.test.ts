import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createLiveMarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import {
  buildCryptoOpportunity,
} from "@/lib/opportunities/cryptoOpportunityBuilder";

describe(
  "buildCryptoOpportunity",
  () => {
    it(
      "builds the normalized crypto opportunity shape with market quality",
      () => {
        const opportunity =
          buildCryptoOpportunity({
            asset: " Bitcoin ",
            symbol: " btc ",
            market: {
              price: 100,
              priceChange24h: 3,
              volume24hUsd:
                1_000_000_000,
              volatility24h: 4,
              marketCapUsd:
                10_000_000_000,
            },
          });

        expect(
          opportunity,
        ).toEqual({
          rank: 0,
          asset: "Bitcoin",
          symbol: "BTC",
          category: "Crypto",
          score: 75,
          expectedReturn: "+10.05%",
          risk: "Medium",
          confidence: 75,
          trend: "Bullish",
          historicalAccuracy: 81,
          currentPriceUsd: 100,
          priceChange24h: 3,
          volatility24h: 4,
          volume24hUsd:
            1_000_000_000,
          dataSource: "fallback",
          source:
            "MarketPilot Demo",
          lastUpdated: null,
          isStale: false,
          marketQuality: {
            score: 85,
            level: "Excellent",
            liquidityScore: 25,
            marketCapScore: 25,
            volatilityScore: 20,
            freshnessScore: 15,
          },
        });
      },
    );

    it(
      "attaches supplied live market metadata and quality",
      () => {
        const metadata =
          createLiveMarketDataMetadata({
            source: "CoinGecko",
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:03:00.000Z",
              ),
          });

        const opportunity =
          buildCryptoOpportunity({
            asset: "Ethereum",
            symbol: "ETH",
            market: {
              price: 3_000,
              priceChange24h: 5,
              volume24hUsd:
                2_000_000_000,
              volatility24h: 4,
              marketCapUsd:
                400_000_000_000,
            },
            metadata,
          });

        expect(
          opportunity,
        ).toMatchObject({
          symbol: "ETH",
          dataSource: "live",
          source: "CoinGecko",
          lastUpdated:
            "2026-08-02T12:00:00.000Z",
          isStale: false,
          marketQuality: {
            score: 90,
            level: "Excellent",
            liquidityScore: 25,
            marketCapScore: 30,
            volatilityScore: 20,
            freshnessScore: 15,
          },
        });
      },
    );

    it(
      "penalizes stale live data in market quality",
      () => {
        const metadata =
          createLiveMarketDataMetadata({
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:10:00.000Z",
              ),
          });

        const opportunity =
          buildCryptoOpportunity({
            asset: "Solana",
            symbol: "SOL",
            market: {
              price: 150,
              priceChange24h: 2,
              volume24hUsd:
                1_000_000_000,
              volatility24h: 4,
              marketCapUsd:
                80_000_000_000,
            },
            metadata,
          });

        expect(
          opportunity,
        ).toMatchObject({
          dataSource: "live",
          source: "CoinGecko",
          isStale: true,
          marketQuality: {
            score: 70,
            level: "Good",
            liquidityScore: 25,
            marketCapScore: 25,
            volatilityScore: 20,
            freshnessScore: 0,
          },
        });
      },
    );

    it(
      "handles a missing market capitalization",
      () => {
        const opportunity =
          buildCryptoOpportunity({
            asset: "Unknown Cap",
            symbol: "UNC",
            market: {
              price: 25,
              priceChange24h: 2,
              volume24hUsd:
                100_000_000,
              volatility24h: 5,
              marketCapUsd: null,
            },
          });

        expect(
          opportunity.marketQuality,
        ).toEqual({
          score: 39,
          level: "Poor",
          liquidityScore: 12,
          marketCapScore: 0,
          volatilityScore: 12,
          freshnessScore: 15,
        });
      },
    );

    it(
      "classifies bearish high-volatility markets consistently",
      () => {
        const opportunity =
          buildCryptoOpportunity({
            asset: "Risk Asset",
            symbol: "RSK",
            market: {
              price: 50,
              priceChange24h: -4,
              volume24hUsd:
                50_000_000,
              volatility24h: 10,
              marketCapUsd:
                250_000_000,
            },
          });

        expect(
          opportunity,
        ).toMatchObject({
          symbol: "RSK",
          risk: "High",
          trend: "Bearish",
          expectedReturn: "+2.04%",
          marketQuality: {
            score: 45,
            level: "Fair",
            liquidityScore: 12,
            marketCapScore: 12,
            volatilityScore: 6,
            freshnessScore: 15,
          },
        });
      },
    );

    it(
      "uses eight decimal places for prices below one dollar",
      () => {
        const opportunity =
          buildCryptoOpportunity({
            asset:
              "Small Price Asset",
            symbol: "SPA",
            market: {
              price: 0.123456789,
              priceChange24h: 1,
              volume24hUsd:
                250_000_000,
              volatility24h: 2,
              marketCapUsd:
                1_000_000_000,
            },
          });

        expect(
          opportunity.currentPriceUsd,
        ).toBe(0.12345679);
      },
    );

    it(
      "rejects an invalid market price",
      () => {
        expect(() =>
          buildCryptoOpportunity({
            asset:
              "Invalid Asset",
            symbol: "BAD",
            market: {
              price: 0,
              priceChange24h: 1,
              volume24hUsd:
                100_000_000,
              volatility24h: 2,
              marketCapUsd:
                1_000_000_000,
            },
          }),
        ).toThrow(
          "Invalid market price received for BAD.",
        );
      },
    );

    it(
      "rejects an empty asset name",
      () => {
        expect(() =>
          buildCryptoOpportunity({
            asset: "   ",
            symbol: "AAA",
            market: {
              price: 100,
              priceChange24h: 1,
              volume24hUsd:
                100_000_000,
              volatility24h: 2,
              marketCapUsd:
                1_000_000_000,
            },
          }),
        ).toThrow(
          "Crypto opportunity asset name is required.",
        );
      },
    );

    it(
      "rejects an empty symbol",
      () => {
        expect(() =>
          buildCryptoOpportunity({
            asset: "Alpha",
            symbol: "   ",
            market: {
              price: 100,
              priceChange24h: 1,
              volume24hUsd:
                100_000_000,
              volatility24h: 2,
              marketCapUsd:
                1_000_000_000,
            },
          }),
        ).toThrow(
          "Crypto opportunity symbol is required.",
        );
      },
    );
  },
);
