"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import type { LiveCryptoOpportunity } from "@/data/getLiveCryptoOpportunities";

type CoinOption = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
};

type ChartPoint = {
  timestamp: number;
  price: number;
};

type ChartApiResponse = {
  success: boolean;
  coin?: string;
  days?: number;
  updatedAt?: string;
  data?: ChartPoint[];
  message?: string;
};

type CryptoPriceChartProps = {
  cryptoOpportunities: LiveCryptoOpportunity[];
};

const chartWidth = 900;
const chartHeight = 280;
const chartPadding = 24;

export default function CryptoPriceChart({
  cryptoOpportunities,
}: CryptoPriceChartProps) {
  const coins = useMemo<CoinOption[]>(
    () =>
      cryptoOpportunities
        .flatMap((opportunity) => {
          const mapping =
            cryptoMarketMap.find(
              (crypto) =>
                crypto.symbol ===
                opportunity.symbol,
            );

          if (!mapping) {
            return [];
          }

          return [
            {
              id: mapping.id,
              name: opportunity.asset,
              symbol: opportunity.symbol,
              rank: opportunity.rank,
            },
          ];
        })
        .slice(0, 5),
    [cryptoOpportunities],
  );

  const [
    selectedCoinId,
    setSelectedCoinId,
  ] = useState<string | null>(
    coins[0]?.id ?? null,
  );

  const selectedCoin = useMemo(
    () =>
      coins.find(
        (coin) =>
          coin.id === selectedCoinId,
      ) ??
      coins[0] ??
      null,
    [coins, selectedCoinId],
  );

  const [days, setDays] =
    useState<7 | 30>(7);

  const [points, setPoints] =
    useState<ChartPoint[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!selectedCoin) {
      return;
    }

    const coin = selectedCoin;
    const controller =
      new AbortController();

    async function loadChart() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/crypto/chart?coin=${coin.id}&days=${days}`,
          {
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as ChartApiResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ??
              "Unable to load chart data.",
          );
        }

        setPoints(result.data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to load crypto chart:",
          error,
        );

        setPoints([]);
        setErrorMessage(
          "Historical price data is temporarily unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      controller.abort();
    };
  }, [selectedCoin, days]);

  const chart = useMemo(() => {
    if (points.length < 2) {
      return null;
    }

    const prices = points.map(
      (point) => point.price,
    );

    const minimumPrice =
      Math.min(...prices);

    const maximumPrice =
      Math.max(...prices);

    const priceRange =
      maximumPrice - minimumPrice || 1;

    const drawableWidth =
      chartWidth -
      chartPadding * 2;

    const drawableHeight =
      chartHeight -
      chartPadding * 2;

    const coordinates = points.map(
      (point, index) => {
        const x =
          chartPadding +
          (index /
            Math.max(
              points.length - 1,
              1,
            )) *
            drawableWidth;

        const normalizedPrice =
          (point.price -
            minimumPrice) /
          priceRange;

        const y =
          chartHeight -
          chartPadding -
          normalizedPrice *
            drawableHeight;

        return {
          ...point,
          x,
          y,
        };
      },
    );

    const linePath =
      coordinates
        .map(
          (point, index) =>
            index === 0
              ? `M ${point.x} ${point.y}`
              : `L ${point.x} ${point.y}`,
        )
        .join(" ");

    const firstPoint =
      coordinates[0];

    const lastPoint =
      coordinates[
        coordinates.length - 1
      ];

    const areaPath = [
      linePath,
      `L ${lastPoint.x} ${
        chartHeight -
        chartPadding
      }`,
      `L ${firstPoint.x} ${
        chartHeight -
        chartPadding
      }`,
      "Z",
    ].join(" ");

    const firstPrice =
      points[0].price;

    const latestPrice =
      points[
        points.length - 1
      ].price;

    const changePercentage =
      ((latestPrice -
        firstPrice) /
        firstPrice) *
      100;

    return {
      linePath,
      areaPath,
      minimumPrice,
      maximumPrice,
      latestPrice,
      changePercentage,
      isNegative:
        changePercentage < 0,
    };
  }, [points]);

  const currencyFormatter =
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits:
          chart &&
          chart.latestPrice < 100
            ? 2
            : 0,
      },
    );

  return (
    <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Historical market data
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Live Price Chart
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Compare recent price movement
            for the current top-ranked
            crypto opportunities.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          {[7, 30].map((period) => {
            const typedPeriod =
              period as 7 | 30;

            return (
              <button
                key={period}
                type="button"
                onClick={() =>
                  setDays(
                    typedPeriod,
                  )
                }
                className={
                  days === typedPeriod
                    ? "rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm"
                    : "rounded-lg px-4 py-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
                }
              >
                {period}D
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {coins.map((coin) => {
          const isActive =
            selectedCoin?.id ===
            coin.id;

          return (
            <button
              key={coin.id}
              type="button"
              onClick={() =>
                setSelectedCoinId(
                  coin.id,
                )
              }
              className={
                isActive
                  ? "flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-md"
                  : "flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              }
            >
              <span>
                #{coin.rank}
              </span>

              <span>
                {coin.symbol}
              </span>
            </button>
          );
        })}
      </div>

      {coins.length === 0 ? (
        <div className="mt-7 flex h-80 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 text-center">
          <div>
            <p className="text-lg font-bold text-amber-800">
              Chart unavailable
            </p>

            <p className="mt-2 text-sm text-amber-700">
              No ranked cryptocurrency
              is currently available for
              historical charting.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          {isLoading && (
            <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-50">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Loading{" "}
                  {selectedCoin?.name ??
                    "market"}{" "}
                  chart...
                </p>
              </div>
            </div>
          )}

          {!isLoading &&
            errorMessage && (
              <div className="flex h-80 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 text-center">
                <div>
                  <p className="text-lg font-bold text-amber-800">
                    Chart unavailable
                  </p>

                  <p className="mt-2 text-sm text-amber-700">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

          {!isLoading &&
            !errorMessage &&
            chart &&
            selectedCoin && (
              <>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      #{selectedCoin.rank}{" "}
                      {selectedCoin.name}{" "}
                      {selectedCoin.symbol}
                    </p>

                    <p className="mt-1 text-3xl font-black text-slate-900">
                      {currencyFormatter.format(
                        chart.latestPrice,
                      )}
                    </p>
                  </div>

                  <div
                    className={
                      chart.isNegative
                        ? "rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700"
                        : "rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700"
                    }
                  >
                    {chart.isNegative ? "\u2198" : "\u2197"}{" "}
                    {chart.changePercentage >=
                    0
                      ? "+"
                      : ""}
                    {chart.changePercentage.toFixed(
                      2,
                    )}
                    % over {days} days
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-slate-950 p-3 sm:p-5">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    role="img"
                    aria-label={`${selectedCoin.name} ${days}-day price chart`}
                    className="h-auto w-full"
                  >
                    <defs>
                      <linearGradient
                        id="chart-area-gradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            chart.isNegative
                              ? "#ef4444"
                              : "#2563eb"
                          }
                          stopOpacity="0.45"
                        />

                        <stop
                          offset="100%"
                          stopColor={
                            chart.isNegative
                              ? "#ef4444"
                              : "#10b981"
                          }
                          stopOpacity="0.03"
                        />
                      </linearGradient>
                    </defs>

                    {[0.25, 0.5, 0.75].map(
                      (position) => (
                        <line
                          key={
                            position
                          }
                          x1={
                            chartPadding
                          }
                          x2={
                            chartWidth -
                            chartPadding
                          }
                          y1={
                            chartPadding +
                            position *
                              (chartHeight -
                                chartPadding *
                                  2)
                          }
                          y2={
                            chartPadding +
                            position *
                              (chartHeight -
                                chartPadding *
                                  2)
                          }
                          stroke="#334155"
                          strokeDasharray="5 7"
                          strokeWidth="1"
                        />
                      ),
                    )}

                    <path
                      d={chart.areaPath}
                      fill="url(#chart-area-gradient)"
                    />

                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke={
                        chart.isNegative
                          ? "#f87171"
                          : "#34d399"
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                    />
                  </svg>
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-4 text-xs font-semibold text-slate-500">
                  <span>
                    Period low:{" "}
                    {currencyFormatter.format(
                      chart.minimumPrice,
                    )}
                  </span>

                  <span>
                    Period high:{" "}
                    {currencyFormatter.format(
                      chart.maximumPrice,
                    )}
                  </span>
                </div>
              </>
            )}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-400">
        Historical prices are provided
        for research purposes and do not
        guarantee future performance.
      </p>
    </section>
  );
}
