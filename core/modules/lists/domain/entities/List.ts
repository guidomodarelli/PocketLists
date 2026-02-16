import type { EntityId } from "@/core/modules/shared/domain/value-objects/EntityId";
import type { ItemNode } from "./ItemNode";

export type List = {
  id: EntityId;
  title: string;
  items: ItemNode[];
};

export type ListSummary = Pick<List, "id" | "title">;
