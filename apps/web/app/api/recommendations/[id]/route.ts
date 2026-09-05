import { NextResponse } from "next/server";

import {
  recommendationService,
} from "@/lib/services/api/recommendationService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const { id } =
    await context.params;

  const recommendation =
    await recommendationService.getRecommendation(
      id,
    );

  if (!recommendation) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Recommendation not found",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    success: true,
    data: recommendation,
  });
}
