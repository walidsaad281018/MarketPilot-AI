import {
  createApplicationComposition,
} from "@/lib/application/applicationComposition";

const operation =
  process.argv[2];

const databasePath =
  process.argv[3];

if (
  operation !== "write" &&
  operation !== "read"
) {
  throw new Error(
    'Operation must be either "write" or "read".',
  );
}

if (!databasePath) {
  throw new Error(
    "A database path is required.",
  );
}

const recommendationId =
  "MP-PERSISTENCE-0001";

async function main() {
  const application =
    createApplicationComposition({
      databasePath,
      seedDatabase: false,
    });

  try {
  if (operation === "write") {
    const result =
      await application
        .recommendationPublisher
        .publish([
          {
            id: recommendationId,
            asset:
              "Persistence Test Asset",
            symbol: "PST",
            category: "Crypto",
            publishedAt:
              "2026-08-01",
            evaluationDate:
              "2026-08-08",
            entryPrice: 100,
            evaluationPrice: null,
            targetReturn: 5,
            score: 90,
            confidence: 88,
          },
        ]);

    process.stdout.write(
      JSON.stringify({
        operation,
        publishedCount:
          result.publishedCount,
        recommendation:
          result.publishedRecords[0] ??
          null,
      }),
    );
  } else {
    const recommendation =
      await application
        .recommendationService
        .getRecommendation(
          recommendationId,
        );

    process.stdout.write(
      JSON.stringify({
        operation,
        found:
          recommendation !==
          undefined,
        recommendation:
          recommendation ?? null,
      }),
    );
  }
} finally {
    application.close();
  }
}

main().catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
