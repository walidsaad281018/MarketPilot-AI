export type MarketQualityLevel =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Poor";

export type MarketQualityInput = {
  volume24hUsd: number;
  marketCapUsd: number | null;
  volatility24h: number;
  isStale: boolean;
};

export type MarketQualityAssessment = {
  score: number;
  level: MarketQualityLevel;
  liquidityScore: number;
  marketCapScore: number;
  volatilityScore: number;
  freshnessScore: number;
};

export function assessMarketQuality(
  input: MarketQualityInput,
): MarketQualityAssessment {
  validateInput(input);

  const liquidityScore =
    calculateLiquidityScore(
      input.volume24hUsd,
    );

  const marketCapScore =
    calculateMarketCapScore(
      input.marketCapUsd,
    );

  const volatilityScore =
    calculateVolatilityScore(
      input.volatility24h,
    );

  const freshnessScore =
    input.isStale ? 0 : 15;

  const score =
    liquidityScore +
    marketCapScore +
    volatilityScore +
    freshnessScore;

  return {
    score,
    level:
      determineQualityLevel(
        score,
      ),
    liquidityScore,
    marketCapScore,
    volatilityScore,
    freshnessScore,
  };
}

function calculateLiquidityScore(
  volume24hUsd: number,
): number {
  if (
    volume24hUsd >=
    5_000_000_000
  ) {
    return 30;
  }

  if (
    volume24hUsd >=
    1_000_000_000
  ) {
    return 25;
  }

  if (
    volume24hUsd >=
    250_000_000
  ) {
    return 20;
  }

  if (
    volume24hUsd >=
    50_000_000
  ) {
    return 12;
  }

  if (
    volume24hUsd >=
    10_000_000
  ) {
    return 6;
  }

  return 0;
}

function calculateMarketCapScore(
  marketCapUsd: number | null,
): number {
  if (marketCapUsd === null) {
    return 0;
  }

  if (
    marketCapUsd >=
    100_000_000_000
  ) {
    return 30;
  }

  if (
    marketCapUsd >=
    10_000_000_000
  ) {
    return 25;
  }

  if (
    marketCapUsd >=
    1_000_000_000
  ) {
    return 20;
  }

  if (
    marketCapUsd >=
    250_000_000
  ) {
    return 12;
  }

  if (
    marketCapUsd >=
    50_000_000
  ) {
    return 6;
  }

  return 0;
}

function calculateVolatilityScore(
  volatility24h: number,
): number {
  if (volatility24h <= 2) {
    return 25;
  }

  if (volatility24h <= 4) {
    return 20;
  }

  if (volatility24h <= 8) {
    return 12;
  }

  if (volatility24h <= 12) {
    return 6;
  }

  return 0;
}

function determineQualityLevel(
  score: number,
): MarketQualityLevel {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 65) {
    return "Good";
  }

  if (score >= 40) {
    return "Fair";
  }

  return "Poor";
}

function validateInput(
  input: MarketQualityInput,
): void {
  validateNonNegativeNumber(
    input.volume24hUsd,
    "Market volume",
  );

  validateNonNegativeNumber(
    input.volatility24h,
    "Market volatility",
  );

  if (
    input.marketCapUsd !== null
  ) {
    validateNonNegativeNumber(
      input.marketCapUsd,
      "Market capitalization",
    );
  }
}

function validateNonNegativeNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative number.`,
    );
  }
}
