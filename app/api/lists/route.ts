import { NextResponse } from "next/server";
import {
  completeParent,
  createList,
  createItem,
  deleteList,
  deleteItem,
  getDefaultListId,
  getListById,
  getListSummaries,
  getNodeById,
  resetCompletedItems,
  toggleItem,
  uncheckParent,
  updateItemTitle,
  updateListTitle,
} from "@/app/features/lists/services";
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

type ListsMutationAction =
  | "toggleItem"
  | "confirmParent"
  | "confirmUncheckParent"
  | "resetCompleted"
  | "createItem"
  | "deleteItem"
  | "editItemTitle"
  | "createList"
  | "editListTitle"
  | "deleteList";

type ListsMutationRequest = {
  action?: ListsMutationAction;
  payload?: Record<string, unknown>;
};

type ListsMutationResponse = {
  redirectTo: string;
};

function buildListPath(listId: string): string {
  return `/lists/${encodeURIComponent(listId)}`;
}

function readString(payload: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function readRequiredString(payload: Record<string, unknown> | undefined, key: string): string | null {
  const value = readString(payload, key);
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value;
}

function readBoolean(payload: Record<string, unknown> | undefined, key: string): boolean | null {
  const value = readString(payload, key);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function respondRedirect(redirectTo: string): NextResponse<ListsMutationResponse> {
  return NextResponse.json<ListsMutationResponse>({ redirectTo }, { status: 200 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = validateQueryParams(searchParams);

  if (!validation.ok) {
    return NextResponse.json<ApiError>(validation.error, { status: 400 });
  }

  const requestedListId = searchParams.get("listId") ?? (await getDefaultListId());
  if (!requestedListId) {
    return NextResponse.json<ApiError>(
      {
        error: "No hay listas disponibles.",
        details: "Creá una lista nueva para comenzar.",
      },
      { status: 404 }
    );
  }

  const activeList = await getListById(requestedListId);
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
    lists: await getListSummaries(),
    activeList,
  };

  return NextResponse.json<ListsResponse>(response, { status: 200 });
}

export async function POST(request: Request) {
  const requestData = (await request.json().catch(() => null)) as ListsMutationRequest | null;

  if (!requestData || typeof requestData !== "object") {
    return NextResponse.json<ApiError>(
      {
        error: "Payload inválido.",
        details: "Enviá un objeto JSON con la acción solicitada.",
      },
      { status: 400 }
    );
  }

  const { action, payload } = requestData;

  if (!action) {
    return NextResponse.json<ApiError>(
      {
        error: "Acción inválida.",
        details: "Indicá una acción soportada para continuar.",
      },
      { status: 400 }
    );
  }

  if (action === "createList") {
    const newList = await createList("Sin nombre");
    return respondRedirect(buildListPath(newList.id));
  }

  const listId = readRequiredString(payload, "listId");
  if (!listId) {
    return NextResponse.json<ApiError>(
      {
        error: "Payload inválido.",
        details: 'El campo "listId" es requerido.',
      },
      { status: 400 }
    );
  }

  const listPath = buildListPath(listId);

  if (action === "toggleItem") {
    const id = readRequiredString(payload, "id");
    const nextCompleted = readBoolean(payload, "nextCompleted");

    if (!id || nextCompleted === null) {
      return respondRedirect(`${listPath}?error=action`);
    }

    const currentNode = await getNodeById(listId, id);
    if (!currentNode) {
      return respondRedirect(`${listPath}?error=action`);
    }

    if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
      return respondRedirect(`${listPath}?confirm=${encodeURIComponent(id)}`);
    }

    const result = await toggleItem(listId, id, nextCompleted);
    return respondRedirect(result ? listPath : `${listPath}?error=action`);
  }

  if (action === "confirmParent") {
    const id = readRequiredString(payload, "id");
    if (!id || !(await getNodeById(listId, id))) {
      return respondRedirect(`${listPath}?error=action`);
    }

    const result = await completeParent(listId, id);
    return respondRedirect(result ? listPath : `${listPath}?error=action`);
  }

  if (action === "confirmUncheckParent") {
    const id = readRequiredString(payload, "id");
    const reopenCompletedDialog = readBoolean(payload, "reopenCompletedDialog") === true;

    if (!id || !(await getNodeById(listId, id))) {
      return respondRedirect(`${listPath}?error=action`);
    }

    const result = await uncheckParent(listId, id);
    if (!result) {
      return respondRedirect(`${listPath}?error=action`);
    }

    return respondRedirect(reopenCompletedDialog ? `${listPath}?openCompleted=true` : listPath);
  }

  if (action === "resetCompleted") {
    const result = await resetCompletedItems(listId);
    return respondRedirect(result ? listPath : `${listPath}?error=action`);
  }

  if (action === "createItem") {
    const title = readRequiredString(payload, "title");
    const parentId = readString(payload, "parentId");

    if (!title) {
      return respondRedirect(`${listPath}?error=add`);
    }

    if (parentId && !(await getNodeById(listId, parentId))) {
      return respondRedirect(`${listPath}?error=add`);
    }

    const result = await createItem(listId, title, parentId);
    return respondRedirect(result ? listPath : `${listPath}?error=add`);
  }

  if (action === "deleteItem") {
    const id = readRequiredString(payload, "id");
    if (!id || !(await getNodeById(listId, id))) {
      return respondRedirect(`${listPath}?error=delete`);
    }

    const result = await deleteItem(listId, id);
    return respondRedirect(result ? listPath : `${listPath}?error=delete`);
  }

  if (action === "editItemTitle") {
    const id = readRequiredString(payload, "id");
    const title = readRequiredString(payload, "title");

    if (!id || !title || !(await getNodeById(listId, id))) {
      return respondRedirect(`${listPath}?error=edit`);
    }

    const result = await updateItemTitle(listId, id, title);
    return respondRedirect(result ? listPath : `${listPath}?error=edit`);
  }

  if (action === "editListTitle") {
    const title = readString(payload, "title");
    if (title === undefined) {
      return respondRedirect(`${listPath}?error=listEdit`);
    }

    const result = await updateListTitle(listId, title);
    return respondRedirect(result ? listPath : `${listPath}?error=listEdit`);
  }

  if (action === "deleteList") {
    const currentListId = readString(payload, "currentListId") ?? listId;
    const currentListPath = buildListPath(currentListId);

    const deleted = await deleteList(listId);
    if (!deleted) {
      return respondRedirect(`${currentListPath}?error=listDelete`);
    }

    let redirectListId = currentListId;
    if (listId === currentListId || !(await getListById(currentListId))) {
      redirectListId = (await getDefaultListId()) ?? (await createList("Sin nombre")).id;
    }

    return respondRedirect(buildListPath(redirectListId));
  }

  return NextResponse.json<ApiError>(
    {
      error: "Acción no soportada.",
      details: "Usá una acción válida para operar sobre listas.",
    },
    { status: 400 }
  );
}
