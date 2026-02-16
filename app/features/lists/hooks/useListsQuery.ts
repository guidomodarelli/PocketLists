"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ApiError, List, ListSummary, ListsResponse } from "../types";

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

type FetchListsOptions = {
  scope?: "full" | "active";
  listsFallback?: ListSummary[];
};

function parseListsResponse(
  payload: unknown,
  options: FetchListsOptions
): ListsResponse {
  const typedPayload = payload as Partial<ListsResponse> | null;
  if (!typedPayload?.activeList) {
    throw new Error("No pudimos obtener la lista solicitada.");
  }

  if (options.scope === "active") {
    return {
      lists: options.listsFallback ?? [],
      activeList: typedPayload.activeList,
    };
  }

  return typedPayload as ListsResponse;
}

export async function fetchLists(listId: string, options: FetchListsOptions = {}): Promise<ListsResponse> {
  const scopeQuery = options.scope === "active" ? "&scope=active" : "";
  const response = await fetch(`/api/lists?listId=${encodeURIComponent(listId)}${scopeQuery}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as unknown;
  return parseListsResponse(payload, options);
}

export async function fetchActiveList(listId: string): Promise<List> {
  const response = await fetchLists(listId, { scope: "active" });
  return response.activeList;
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

type UseActiveListQueryOptions = {
  initialActiveList?: List;
  listsFallback: ListSummary[];
};

export function useActiveListQuery(
  listId: string,
  options: UseActiveListQueryOptions
): UseQueryResult<ListsResponse, Error> {
  return useQuery<ListsResponse, Error>({
    queryKey: listsQueryKey(listId),
    queryFn: () =>
      fetchLists(listId, {
        scope: "active",
        listsFallback: options.listsFallback,
      }),
    initialData: options.initialActiveList
      ? {
          lists: options.listsFallback,
          activeList: options.initialActiveList,
        }
      : undefined,
    enabled: listId.trim().length > 0,
  });
}
