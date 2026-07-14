export type CryptoPrice = {
  usd: number;
  usd_24h_change: number;
};

type CoinGeckoPriceResponse = Record<string, CryptoPrice>;

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price";

export async function getCryptoPrices(
  coinIds: string[],
): Promise<CoinGeckoPriceResponse> {
  const query = new URLSearchParams({
    ids: coinIds.join(","),
    vs_currencies: "usd",
    include_24hr_change: "true",
  });

  const response = await fetch(`${COINGECKO_URL}?${query}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<CoinGeckoPriceResponse>;
}