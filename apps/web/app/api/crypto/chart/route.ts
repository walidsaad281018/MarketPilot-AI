import { getCryptoMarketChart } from "@/services/coingecko";

const DEFAULT_COIN_ID = "bitcoin";

const COIN_ID_PATTERN =
  /^[a-z0-9][a-z0-9-]{0,99}$/;

const supportedPeriods = new Set<number>([
  7,
  30,
]);

export async function GET(request: Request) {
  const url = new URL(request.url);

  const coin =
    (
      url.searchParams.get("coin") ??
      DEFAULT_COIN_ID
    )
      .trim()
      .toLowerCase();

  const requestedDays = Number(
    url.searchParams.get("days") ?? "7",
  );

  if (!COIN_ID_PATTERN.test(coin)) {
    return Response.json(
      {
        success: false,
        message:
          "Invalid cryptocurrency identifier.",
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