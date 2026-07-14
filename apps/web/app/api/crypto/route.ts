import { getCryptoPrices } from "@/services/coingecko";

const supportedCoins = [
  "bitcoin",
  "ethereum",
  "solana",
];

export async function GET() {
  try {
    const prices = await getCryptoPrices(supportedCoins);

    return Response.json({
      success: true,
      updatedAt: new Date().toISOString(),
      data: prices,
    });
  } catch (error) {
    console.error("Crypto API error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load crypto prices.",
      },
      {
        status: 500,
      },
    );
  }
}