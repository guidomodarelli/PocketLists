"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  applyOptimisticMutation,
  type ListsMutationAction,
  type OptimisticPayload,
} from "../optimistic";
import type { ListsResponse } from "../types";
import { fetchLists, listsQueryKey } from "./useListsQuery";

type ListsMutationResponse = {
  redirectTo: string;
};

type ListsMutationVariables = {
  action: ListsMutationAction;
  payload: OptimisticPayload;
};

type ListsMutationContext = {
  previousData?: ListsResponse;
};

type UseListsMutationsOptions = {
  onRedirect?: (redirectTo: string, targetListId: string) => void;
};

const ACTION_ERROR_MESSAGES: Record<string, string> = {
  action: "No pudimos completar la acción. Revertimos los cambios.",
  add: "No pudimos agregar el ítem. Revertimos los cambios.",
  delete: "No pudimos eliminar el ítem. Revertimos los cambios.",
  edit: "No pudimos editar el ítem. Revertimos los cambios.",
  listEdit: "No pudimos editar la lista. Revertimos los cambios.",
  listDelete: "No pudimos eliminar la lista. Revertimos los cambios.",
};

function normalizePayload(payload: Record<string, string | boolean | undefined>): OptimisticPayload {
  const normalized: OptimisticPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }
    normalized[key] = typeof value === "boolean" ? String(value) : value;
  }
  return normalized;
}

function parseRedirect(redirectTo: string): URL {
  return new URL(redirectTo, "http://localhost");
}

function getListIdFromRedirect(redirectTo: string): string | null {
  const redirectUrl = parseRedirect(redirectTo);
  const pathSegments = redirectUrl.pathname.split("/");
  if (pathSegments[1] !== "lists" || !pathSegments[2]) {
    return null;
  }

  return decodeURIComponent(pathSegments[2]);
}

function getActionErrorFromRedirect(redirectTo: string): string | null {
  const redirectUrl = parseRedirect(redirectTo);
  const errorCode = redirectUrl.searchParams.get("error");
  if (!errorCode) {
    return null;
  }

  return ACTION_ERROR_MESSAGES[errorCode] ?? "No pudimos completar la acción. Revertimos los cambios.";
}

async function runListsMutation(variables: ListsMutationVariables): Promise<ListsMutationResponse> {
  const response = await fetch("/api/lists", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(variables),
  });

  if (!response.ok) {
    throw new Error("No pudimos comunicarnos con el servidor.");
  }

  const body = (await response.json().catch(() => null)) as ListsMutationResponse | null;
  if (!body?.redirectTo) {
    throw new Error("No pudimos interpretar la respuesta del servidor.");
  }

  const mappedError = getActionErrorFromRedirect(body.redirectTo);
  if (mappedError) {
    throw new Error(mappedError);
  }

  return body;
}

export function useListsMutations(listId: string, options: UseListsMutationsOptions = {}) {
  const queryClient = useQueryClient();
  const queryKey = listsQueryKey(listId);
  const mutationKey = ["lists-mutation", listId] as const;

  const hasConcurrentMutations = () => queryClient.isMutating({ mutationKey }) > 1;

  const syncCanonicalData = async (targetListId: string) => {
    try {
      const canonicalData = await fetchLists(targetListId);
      queryClient.setQueryData(listsQueryKey(targetListId), canonicalData);
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["lists"] });
    }
  };

  const mutation = useMutation<ListsMutationResponse, Error, ListsMutationVariables, ListsMutationContext>({
    mutationKey,
    mutationFn: runListsMutation,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<ListsResponse>(queryKey);
      if (previousData) {
        const optimisticData = applyOptimisticMutation(previousData, variables.action, variables.payload);
        queryClient.setQueryData(queryKey, optimisticData);
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(error.message);
    },
    onSuccess: async (result, variables) => {
      const targetListId = getListIdFromRedirect(result.redirectTo) ?? listId;

      if (variables.action === "toggleItem") {
        // Keep optimistic state without immediate canonical refetch to avoid visual flicker
        // when the user toggles multiple items in quick succession.
      } else if (!hasConcurrentMutations()) {
        // When multiple mutations are in flight, syncing after each success can temporarily
        // overwrite newer optimistic changes and cause UI flicker.
        await syncCanonicalData(targetListId);
      }

      options.onRedirect?.(result.redirectTo, targetListId);
    },
  });

  const mutateAction = async (
    action: ListsMutationAction,
    payload: Record<string, string | boolean | undefined>
  ) => {
    const normalizedPayload = normalizePayload(payload);
    try {
      return await mutation.mutateAsync({ action, payload: normalizedPayload });
    } catch {
      return null;
    }
  };

  return {
    mutateAction,
    isMutating: mutation.isPending,
    pendingAction: mutation.variables?.action,
  };
}
