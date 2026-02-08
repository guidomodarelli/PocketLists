"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { completeParent, getNodeById, toggleItem } from "./services";

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

export async function toggleItemAction(formData: FormData): Promise<void> {
  const id = readRequiredString(formData, "id");
  const nextCompleted = readRequiredBoolean(formData, "nextCompleted");
  const currentNode = getNodeById(id);

  if (!currentNode) {
    redirect("/?error=accion");
  }

  if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
    redirect(`/?confirm=${encodeURIComponent(id)}`);
  }

  toggleItem(id, nextCompleted);
  revalidateTag("lists", "max");
  redirect("/");
}

export async function confirmParentAction(formData: FormData): Promise<void> {
  const id = readRequiredString(formData, "id");
  const currentNode = getNodeById(id);

  if (!currentNode) {
    redirect("/?error=accion");
  }

  completeParent(id);
  revalidateTag("lists", "max");
  redirect("/");
}
