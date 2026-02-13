"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  completeParent,
  createList,
  createItem,
  deleteItem,
  getNodeById,
  resetCompletedItems,
  toggleItem,
  uncheckParent,
  updateListTitle,
  updateItemTitle,
} from "./services";

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

export async function toggleItemAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const nextCompleted = readRequiredBoolean(formData, "nextCompleted");
  const currentNode = getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    redirect(`${listPath}?error=action`);
  }

  if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
    redirect(`${listPath}?confirm=${encodeURIComponent(id)}`);
  }

  const result = toggleItem(listId, id, nextCompleted);
  if (!result) {
    redirect(`${listPath}?error=action`);
  }
  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function confirmParentAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const currentNode = getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    redirect(`${listPath}?error=action`);
  }

  const result = completeParent(listId, id);
  if (!result) {
    redirect(`${listPath}?error=action`);
  }
  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function confirmUncheckParentAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const currentNode = getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    redirect(`${listPath}?error=action`);
  }

  const result = uncheckParent(listId, id);
  if (!result) {
    redirect(`${listPath}?error=action`);
  }
  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function resetCompletedAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const listPath = buildListPath(listId);
  const result = resetCompletedItems(listId);
  if (!result) {
    redirect(`${listPath}?error=action`);
  }
  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function createItemAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const title = readRequiredString(formData, "title");
  const parentId = readOptionalString(formData, "parentId");
  const listPath = buildListPath(listId);

  if (parentId && !getNodeById(listId, parentId)) {
    redirect(`${listPath}?error=add`);
  }

  const result = createItem(listId, title, parentId);
  if (!result) {
    redirect(`${listPath}?error=add`);
  }

  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const currentNode = getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    redirect(`${listPath}?error=delete`);
  }

  const result = deleteItem(listId, id);
  if (!result) {
    redirect(`${listPath}?error=delete`);
  }

  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function editItemTitleAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const id = readRequiredString(formData, "id");
  const title = readRequiredString(formData, "title");
  const currentNode = getNodeById(listId, id);
  const listPath = buildListPath(listId);

  if (!currentNode) {
    redirect(`${listPath}?error=edit`);
  }

  const result = updateItemTitle(listId, id, title);
  if (!result) {
    redirect(`${listPath}?error=edit`);
  }

  revalidateTag("lists", "max");
  redirect(listPath);
}

export async function createListAction(): Promise<void> {
  const newList = createList("Sin nombre");
  revalidateTag("lists", "max");
  redirect(buildListPath(newList.id));
}

export async function editListTitleAction(formData: FormData): Promise<void> {
  const listId = readRequiredString(formData, "listId");
  const title = readString(formData, "title");
  const listPath = buildListPath(listId);

  const result = updateListTitle(listId, title);
  if (!result) {
    redirect(`${listPath}?error=listEdit`);
  }

  revalidateTag("lists", "max");
  redirect(listPath);
}
