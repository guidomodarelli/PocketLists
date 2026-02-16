"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiError, ListsResponse } from "../types";

export const listsQueryKey = (listId: string) => ["lists", listId] as const;

async function parseApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiError | null;
  if (!body) {
    return "No pudimos obtener las listas. Intentá nuevamente.";
  }
  const details = body.details?.trim();
  if (details && details.length > 0) {
    return `${body.error} ${details}`;
  }
  return body.error;
}

export async function fetchLists(listId: string): Promise<ListsResponse> {
  const response = await fetch(`/api/lists?listId=${encodeURIComponent(listId)}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as ListsResponse;
  return data;
}

export function useListsQuery(
  listId: string,
  initialData?: ListsResponse
): UseQueryResult<ListsResponse, Error> {
  return useQuery<ListsResponse, Error>({
    queryKey: listsQueryKey(listId),
    queryFn: () => fetchLists(listId),
    initialData,
    enabled: listId.trim().length > 0 && Boolean(initialData),
  });
}
