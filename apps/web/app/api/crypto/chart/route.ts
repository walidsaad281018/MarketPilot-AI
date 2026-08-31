import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import { getCryptoMarketChart } from "@/services/coingecko";

const supportedCoins = new Set<string>(
  cryptoMarketMap.map((crypto) => crypto.id),
);

const supportedPeriods = new Set<number>([
  7,
  30,
]);

export async function GET(request: Request) {
  const url = new URL(request.url);

  const coin =
    url.searchParams.get("coin") ??
    cryptoMarketMap[0].id;

  const requestedDays = Number(
    url.searchParams.get("days") ?? "7",
  );

  if (!supportedCoins.has(coin)) {
    return Response.json(
      {
        success: false,
        message: "Unsupported cryptocurrency.",
      },
      {
        status: 400,
      },
    );
  }

  if (!supportedPeriods.has(requestedDays)) {
    return Response.json(
      {
        success: false,
        message: "Unsupported chart period.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const chart = await getCryptoMarketChart(
      coin,
      requestedDays,
    );

    const prices = chart.prices.map(
      ([timestamp, price]) => ({
        timestamp,
        price,
      }),
    );

    return Response.json({
      success: true,
      coin,
      days: requestedDays,
      updatedAt: new Date().toISOString(),
      data: prices,
    });
  } catch (error) {
    console.error(
      "Crypto chart API error:",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          "Unable to load historical market data.",
      },
      {
        status: 500,
      },
    );
  }
}