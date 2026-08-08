import {
  NextResponse,
} from "next/server";

import {
  productionApplication,
} from "@/lib/application/productionApplication";

export const runtime = "nodejs";

export async function POST(
  request: Request,
) {
  const authorizationResult =
    authorizeRequest(
      request,
    );

  if (!authorizationResult.authorized) {
    return NextResponse.json(
      {
        success: false,
        error:
          authorizationResult.error,
      },
      {
        status: 401,
      },
    );
  }

  try {
    const result =
      await productionApplication
        .liveCryptoRecommendationPublicationService
        .publish();

    return NextResponse.json({
      success: true,
      publishedCount:
        result.publishedCount,
      publishedRecords:
        result.publishedRecords,
    });
  } catch (error) {
    console.error(
      "Market cycle failed.",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Market cycle failed.",
      },
      {
        status: 500,
      },
    );
  }
}

function authorizeRequest(
  request: Request,
):
  | {
      authorized: true;
    }
  | {
      authorized: false;
      error: string;
    } {
  const configuredSecret =
    process.env.CRON_SECRET
      ?.trim();

  if (!configuredSecret) {
    return {
      authorized: false,
      error:
        "Cron secret is not configured.",
    };
  }

  const authorizationHeader =
    request.headers
      .get("authorization")
      ?.trim();

  if (
    authorizationHeader !==
    `Bearer ${configuredSecret}`
  ) {
    return {
      authorized: false,
      error:
        "Unauthorized.",
    };
  }

  return {
    authorized: true,
  };
}
