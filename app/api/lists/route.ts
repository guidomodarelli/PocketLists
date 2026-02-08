import { NextResponse } from "next/server";
import { getLists } from "@/app/features/lists/services";
import type { ApiError, ListsResponse } from "@/app/features/lists/types";

function validateQueryParams(searchParams: URLSearchParams): { ok: true } | { ok: false; error: ApiError } {
  const keys = Array.from(new Set(searchParams.keys()));
  if (keys.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    error: {
      error: "Parámetros de consulta no soportados.",
      details: `Eliminá ${keys.join(", ")} e intentá de nuevo.`,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = validateQueryParams(searchParams);

  if (!validation.ok) {
    return NextResponse.json<ApiError>(validation.error, { status: 400 });
  }

  const items = getLists();
  const response: ListsResponse = { items };

  return NextResponse.json<ListsResponse>(response, { status: 200 });
}
