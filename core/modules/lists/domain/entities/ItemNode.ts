import type { EntityId } from "@/core/modules/shared/domain/value-objects/EntityId";

export type ItemNode = {
  id: EntityId;
  title: string;
  completed: boolean;
  children: ItemNode[];
};
