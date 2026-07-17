export type VerificationStatus =
  | "Successful"
  | "Unsuccessful"
  | "Pending";

export type VerificationInput = {
  entryPrice: number;
  evaluationPrice: number | null;
  targetReturn: number;
};

export type VerificationResult = {
  targetPrice: number;
  actualReturn: number | null;
  status: VerificationStatus;
  targetReached: boolean | null;
};

export function verifyRecommendation({
  entryPrice,
  evaluationPrice,
  targetReturn,
}: VerificationInput): VerificationResult {
  validatePositiveNumber(
    entryPrice,
    "Entry price",
  );

  validatePositiveNumber(
    targetReturn,
    "Target return",
  );

  if (
    evaluationPrice !== null &&
    (!Number.isFinite(evaluationPrice) ||
      evaluationPrice < 0)
  ) {
    throw new Error(
      "Evaluation price must be zero or a positive number.",
    );
  }

  const targetPrice =
    entryPrice * (1 + targetReturn / 100);

  if (evaluationPrice === null) {
    return {
      targetPrice: roundNumber(targetPrice),
      actualReturn: null,
      status: "Pending",
      targetReached: null,
    };
  }

  const actualReturn =
    ((evaluationPrice - entryPrice) /
      entryPrice) *
    100;

  const targetReached =
    actualReturn >= targetReturn;

  return {
    targetPrice: roundNumber(targetPrice),
    actualReturn: roundNumber(actualReturn),
    status: targetReached
      ? "Successful"
      : "Unsuccessful",
    targetReached,
  };
}

function validatePositiveNumber(
  value: number,
  fieldName: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `${fieldName} must be a positive number.`,
    );
  }
}

function roundNumber(
  value: number,
  decimalPlaces = 2,
): number {
  const multiplier = 10 ** decimalPlaces;

  return (
    Math.round(
      (value + Number.EPSILON) * multiplier,
    ) / multiplier
  );
}