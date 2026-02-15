"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

type ListsServices = typeof import("./services");
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

async function getListsServices(): Promise<ListsServices> {
  return import("./services");
}

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && process.env.NODE_ENV !== "test";
}

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Falta el campo requerido "${key}".`);
  }
  return value;
}

function readRequiredBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (value !== "true" && value !== "false") {
    throw new Error(`Valor inválido para "${key}".`);
  }
  return value === "true";
}

function readOptionalBoolean(formData: FormData, key: string): boolean | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value !== "true" && value !== "false") {
    throw new Error(`Valor inválido para "${key}".`);
  }
  return value === "true";
}

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Valor inválido para "${key}".`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`Valor inválido para "${key}".`);
  }
  return value;
}

function buildListPath(listId: string): string {
  return `/lists/${encodeURIComponent(listId)}`;
}

function navigateTo(target: string): void {
  if (isBrowserRuntime()) {
    window.location.assign(target);
    return;
  }

  redirect(target);
}

function revalidateListsTagSafely(): void {
  try {
    revalidateTag("lists", "max");
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("static generation store missing")) {
      return;
    }
    throw error;
  }
}

function formDataToPayload(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }
  return payload;
}

async function executeClientMutation(action: ListsMutationAction, formData?: FormData): Promise<void> {
  const payload = formData ? formDataToPayload(formData) : {};
  const fallbackTarget = payload.listId ? buildListPath(payload.listId) : "/";

  try {
    const response = await fetch("/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const body = (await response.json().catch(() => null)) as { redirectTo?: string } | null;
    if (body?.redirectTo) {
      navigateTo(body.redirectTo);
      return;
    }
  } catch {
    // fall through to fallback redirect
  }

  navigateTo(fallbackTarget);
}

export async function toggleItemAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("toggleItem", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const nextCompleted = readRequiredBoolean(formData, "nextCompleted");
  const currentNode = await services.getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    return navigateTo(`${listPath}?error=action`);
  }

  if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
    return navigateTo(`${listPath}?confirm=${encodeURIComponent(id)}`);
  }

  const result = await services.toggleItem(listId, id, nextCompleted);
  if (!result) {
    return navigateTo(`${listPath}?error=action`);
  }
  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function confirmParentAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("confirmParent", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const currentNode = await services.getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    return navigateTo(`${listPath}?error=action`);
  }

  const result = await services.completeParent(listId, id);
  if (!result) {
    return navigateTo(`${listPath}?error=action`);
  }
  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function confirmUncheckParentAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("confirmUncheckParent", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const reopenCompletedDialog = readOptionalBoolean(formData, "reopenCompletedDialog") === true;
  const currentNode = await services.getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    return navigateTo(`${listPath}?error=action`);
  }

  const result = await services.uncheckParent(listId, id);
  if (!result) {
    return navigateTo(`${listPath}?error=action`);
  }
  revalidateListsTagSafely();
  return navigateTo(reopenCompletedDialog ? `${listPath}?openCompleted=true` : listPath);
}

export async function resetCompletedAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("resetCompleted", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const listPath = buildListPath(listId);
  const result = await services.resetCompletedItems(listId);
  if (!result) {
    return navigateTo(`${listPath}?error=action`);
  }
  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function createItemAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("createItem", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const title = readRequiredString(formData, "title");
  const parentId = readOptionalString(formData, "parentId");
  const listPath = buildListPath(listId);

  if (parentId && !(await services.getNodeById(listId, parentId))) {
    return navigateTo(`${listPath}?error=add`);
  }

  const result = await services.createItem(listId, title, parentId);
  if (!result) {
    return navigateTo(`${listPath}?error=add`);
  }

  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("deleteItem", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const currentNode = await services.getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    return navigateTo(`${listPath}?error=delete`);
  }

  const result = await services.deleteItem(listId, id);
  if (!result) {
    return navigateTo(`${listPath}?error=delete`);
  }

  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function editItemTitleAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("editItemTitle", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const title = readRequiredString(formData, "title");
  const currentNode = await services.getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    return navigateTo(`${listPath}?error=edit`);
  }

  const result = await services.updateItemTitle(listId, id, title);
  if (!result) {
    return navigateTo(`${listPath}?error=edit`);
  }

  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function createListAction(): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("createList");
  }

  const services = await getListsServices();
  const newList = await services.createList("Sin nombre");
  revalidateListsTagSafely();
  return navigateTo(buildListPath(newList.id));
}

export async function editListTitleAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("editListTitle", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const title = readString(formData, "title");
  const listPath = buildListPath(listId);

  const result = await services.updateListTitle(listId, title);
  if (!result) {
    return navigateTo(`${listPath}?error=listEdit`);
  }

  revalidateListsTagSafely();
  return navigateTo(listPath);
}

export async function deleteListAction(formData: FormData): Promise<void> {
  if (isBrowserRuntime()) {
    return executeClientMutation("deleteList", formData);
  }

  const services = await getListsServices();
  const listId = readRequiredString(formData, "listId");
  const currentListId = readOptionalString(formData, "currentListId") ?? listId;
  const currentListPath = buildListPath(currentListId);

  const deleted = await services.deleteList(listId);
  if (!deleted) {
    return navigateTo(`${currentListPath}?error=listDelete`);
  }

  let redirectListId = currentListId;
  if (listId === currentListId || !(await services.getListById(currentListId))) {
    redirectListId = (await services.getDefaultListId()) ?? (await services.createList("Sin nombre")).id;
  }

  revalidateListsTagSafely();
  return navigateTo(buildListPath(redirectListId));
}
