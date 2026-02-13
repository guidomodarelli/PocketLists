import { NextResponse } from "next/server";
import { getDefaultListId, getListById, getListSummaries } from "@/app/features/lists/services";
import type { ApiError, ListsResponse } from "@/app/features/lists/types";

function validateQueryParams(
  searchParams: URLSearchParams
): { ok: true } | { ok: false; error: ApiError } {
  const keys = Array.from(new Set(searchParams.keys()));
  const unsupportedKeys = keys.filter((key) => key !== "listId");
  if (unsupportedKeys.length > 0) {
    return {
      ok: false,
      error: {
        error: "Parámetros de consulta no soportados.",
        details: `Eliminá ${unsupportedKeys.join(", ")} e intentá de nuevo.`,
      },
    };
  }

  const listId = searchParams.get("listId");
  if (listId !== null && listId.trim().length === 0) {
    return {
      ok: false,
      error: {
        error: "Parámetro inválido.",
        details: 'El parámetro "listId" no puede estar vacío.',
      },
    };
  }

  return { ok: true };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = validateQueryParams(searchParams);

  if (!validation.ok) {
    return NextResponse.json<ApiError>(validation.error, { status: 400 });
  }

  const requestedListId = searchParams.get("listId") ?? getDefaultListId();
  if (!requestedListId) {
    return NextResponse.json<ApiError>(
      {
        error: "No hay listas disponibles.",
        details: "Creá una lista nueva para comenzar.",
      },
      { status: 404 }
    );
  }

  const activeList = getListById(requestedListId);
  if (!activeList) {
    return NextResponse.json<ApiError>(
      {
        error: "No encontramos la lista solicitada.",
        details: "Seleccioná otra lista desde la barra lateral.",
      },
      { status: 404 }
    );
  }

  const response: ListsResponse = {
    lists: getListSummaries(),
    activeList,
  };

  return NextResponse.json<ListsResponse>(response, { status: 200 });
}
