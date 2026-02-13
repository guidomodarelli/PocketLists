export type ItemNode = {
  id: string;
  title: string;
  completed: boolean;
  children: ItemNode[];
};

export type List = {
  id: string;
  title: string;
  items: ItemNode[];
};

export type ListSummary = {
  id: string;
  title: string;
};

export type TreeMode = "pending" | "completed";

export type VisibleNode = {
  id: string;
  title: string;
  completed: boolean;
  isPartiallyCompleted: boolean;
  isContextOnly: boolean;
  children: VisibleNode[];
};

export type ListsResponse = {
  lists: ListSummary[];
  activeList: List;
};

export type ApiError = {
  error: string;
  details?: string;
};

export type ParentOption = {
  id: string;
  label: string;
};
