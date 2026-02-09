export type ItemNode = {
  id: string;
  title: string;
  completed: boolean;
  children: ItemNode[];
};

export type TreeMode = "pending" | "completed";

export type VisibleNode = {
  id: string;
  title: string;
  completed: boolean;
  isContextOnly: boolean;
  children: VisibleNode[];
};

export type ListsResponse = {
  items: ItemNode[];
};

export type ApiError = {
  error: string;
  details?: string;
};

export type OpcionPadre = {
  id: string;
  etiqueta: string;
};
