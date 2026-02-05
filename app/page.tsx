"use client";

import { useMemo, useState } from "react";

type ItemNode = {
  id: string;
  title: string;
  completed: boolean;
  children: ItemNode[];
};

type TreeMode = "pending" | "completed";

type VisibleNode = {
  id: string;
  title: string;
  completed: boolean;
  isContextOnly: boolean;
  children: VisibleNode[];
};

const INITIAL_ITEMS: ItemNode[] = [
  {
    id: "ropa",
    title: "Ropa",
    completed: false,
    children: [
      { id: "ropa-interior", title: "Ropa interior", completed: true, children: [] },
      { id: "pantalones", title: "Pantalones", completed: true, children: [] },
      { id: "joggers", title: "Joggers", completed: true, children: [] },
      { id: "remeras", title: "Remeras", completed: true, children: [] },
      { id: "camisas", title: "Camisas", completed: true, children: [] },
      { id: "buzos", title: "Buzos", completed: true, children: [] },
      { id: "camperas", title: "Camperas", completed: true, children: [] },
      { id: "zapatillas", title: "Zapatillas", completed: true, children: [] },
      { id: "cinturones", title: "Cinturones", completed: true, children: [] },
      { id: "gorro", title: "Gorro de invierno", completed: true, children: [] },
      { id: "bufanda", title: "Bufanda", completed: true, children: [] },
    ],
  },
  {
    id: "entretenimiento",
    title: "Entretenimiento",
    completed: false,
    children: [
      { id: "auriculares", title: "Auriculares", completed: false, children: [] },
      { id: "libro", title: "Libro", completed: false, children: [] },
    ],
  },
  {
    id: "viaje",
    title: "Artículos para el día del viaje",
    completed: false,
    children: [
      { id: "cargador-celular", title: "Cargador de celular", completed: false, children: [] },
      {
        id: "adaptador-enchufe",
        title: "Adaptador de enchufe",
        completed: true,
        children: [],
      },
      { id: "mochila", title: "Mochila", completed: true, children: [] },
      { id: "botella-agua", title: "Botella de agua", completed: true, children: [] },
      {
        id: "higiene",
        title: "Neceser / Bolsito de Higiene Personal",
        completed: false,
        children: [
          { id: "cepillo-dientes", title: "Cepillo de dientes", completed: true, children: [] },
          { id: "desodorante", title: "Desodorante", completed: true, children: [] },
          { id: "pasta-dental", title: "Pasta dental", completed: true, children: [] },
          { id: "crema-manos", title: "Crema de manos", completed: true, children: [] },
          { id: "shampoo", title: "Shampoo y acondicionador", completed: true, children: [] },
          { id: "jabon", title: "Jabón", completed: true, children: [] },
        ],
      },
    ],
  },
];

function normalizeNode(node: ItemNode): ItemNode {
  const children = node.children.map(normalizeNode);
  if (children.length === 0) {
    return { ...node, children };
  }

  const completed = children.every((child) => child.completed);
  return { ...node, completed, children };
}

function normalizeTree(items: ItemNode[]): ItemNode[] {
  return items.map(normalizeNode);
}

function setSubtreeCompletion(node: ItemNode, completed: boolean): ItemNode {
  return {
    ...node,
    completed,
    children: node.children.map((child) => setSubtreeCompletion(child, completed)),
  };
}

function updateNodeRecursive(
  node: ItemNode,
  id: string,
  updater: (node: ItemNode) => ItemNode
): [ItemNode, boolean] {
  if (node.id === id) {
    return [updater(node), true];
  }

  let childChanged = false;
  const children = node.children.map((child) => {
    const [updatedChild, changed] = updateNodeRecursive(child, id, updater);
    if (changed) {
      childChanged = true;
    }
    return updatedChild;
  });

  if (!childChanged) {
    return [node, false];
  }

  return [{ ...node, children }, true];
}

function updateNodeInTree(
  items: ItemNode[],
  id: string,
  updater: (node: ItemNode) => ItemNode
): ItemNode[] {
  let changed = false;
  const updated = items.map((item) => {
    const [nextItem, itemChanged] = updateNodeRecursive(item, id, updater);
    if (itemChanged) {
      changed = true;
    }
    return nextItem;
  });
  return changed ? updated : items;
}

function findNode(items: ItemNode[], id: string): ItemNode | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    const foundInChildren = findNode(item.children, id);
    if (foundInChildren) {
      return foundInChildren;
    }
  }
  return undefined;
}

function buildVisibleNode(node: ItemNode, mode: TreeMode): VisibleNode | null {
  const children = node.children
    .map((child) => buildVisibleNode(child, mode))
    .filter((child): child is VisibleNode => child !== null);

  if (mode === "pending") {
    if (node.completed && children.length === 0) {
      return null;
    }
    return {
      id: node.id,
      title: node.title,
      completed: node.completed,
      children,
      isContextOnly: node.completed,
    };
  }

  if (!node.completed && children.length === 0) {
    return null;
  }

  return {
    id: node.id,
    title: node.title,
    completed: node.completed,
    children,
    isContextOnly: !node.completed,
  };
}

function buildVisibleTree(items: ItemNode[], mode: TreeMode): VisibleNode[] {
  return items
    .map((item) => buildVisibleNode(item, mode))
    .filter((item): item is VisibleNode => item !== null);
}

function countByStatus(items: ItemNode[], completed: boolean): number {
  return items.reduce((total, item) => {
    const own = item.completed === completed ? 1 : 0;
    return total + own + countByStatus(item.children, completed);
  }, 0);
}

type TreeListProps = {
  nodes: VisibleNode[];
  mode: TreeMode;
  onToggle: (id: string, nextCompleted: boolean) => void;
  depth?: number;
};

function TreeList({ nodes, mode, onToggle, depth = 0 }: TreeListProps) {
  if (nodes.length === 0 && depth === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        No hay ítems para mostrar en esta vista.
      </div>
    );
  }

  return (
    <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-2 border-l border-slate-200 pl-4"}>
      {nodes.map((node) => {
        const titleClasses = node.completed ? "text-slate-500 line-through" : "text-slate-900";

        return (
          <li key={node.id}>
            <div
              className={`flex items-start gap-3 rounded-lg px-2 py-1.5 transition ${
                node.isContextOnly ? "bg-slate-100/80" : "bg-white shadow-sm"
              }`}
            >
              {node.isContextOnly ? (
                <span className="mt-1 h-4 w-4 rounded border border-slate-300 bg-white" aria-hidden />
              ) : (
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-600"
                  checked={node.completed}
                  onChange={(event) => onToggle(node.id, event.target.checked)}
                  aria-label={`Cambiar estado de ${node.title}`}
                />
              )}
              <div>
                <p className={`text-sm font-medium ${titleClasses}`}>{node.title}</p>
                {mode === "completed" && node.isContextOnly ? (
                  <p className="text-xs text-slate-500">Contexto de ruta (pendiente)</p>
                ) : null}
              </div>
            </div>
            {node.children.length > 0 ? (
              <TreeList nodes={node.children} mode={mode} onToggle={onToggle} depth={depth + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  const [items, setItems] = useState<ItemNode[]>(() => normalizeTree(INITIAL_ITEMS));
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  const pendingTree = useMemo(() => buildVisibleTree(items, "pending"), [items]);
  const completedTree = useMemo(() => buildVisibleTree(items, "completed"), [items]);
  const pendingCount = useMemo(() => countByStatus(items, false), [items]);
  const completedCount = useMemo(() => countByStatus(items, true), [items]);
  const parentForConfirmation = pendingParentId ? findNode(items, pendingParentId) : undefined;

  const applyToggle = (id: string, nextCompleted: boolean) => {
    setItems((previousItems) => {
      const updated = updateNodeInTree(previousItems, id, (node) => {
        if (node.children.length > 0) {
          return setSubtreeCompletion(node, nextCompleted);
        }
        return { ...node, completed: nextCompleted };
      });

      return normalizeTree(updated);
    });
  };

  const handleToggle = (id: string, nextCompleted: boolean) => {
    const currentNode = findNode(items, id);
    if (!currentNode) {
      return;
    }

    if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
      setPendingParentId(id);
      return;
    }

    applyToggle(id, nextCompleted);
  };

  const confirmParentCompletion = () => {
    if (!pendingParentId) {
      return;
    }
    applyToggle(pendingParentId, true);
    setPendingParentId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8">
      <main className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Lista de viaje</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              Pendientes: {pendingCount}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
              Completados: {completedCount}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Pendientes</h2>
            <TreeList nodes={pendingTree} mode="pending" onToggle={handleToggle} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-emerald-50/60 p-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Completados</h2>
            <TreeList nodes={completedTree} mode="completed" onToggle={handleToggle} />
          </section>
        </div>
      </main>

      {pendingParentId && parentForConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Completar ítem padre</h3>
            <p className="mt-3 text-sm text-slate-600">
              Vas a completar <strong>{parentForConfirmation.title}</strong> y todos sus descendientes.
              ¿Querés continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setPendingParentId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                onClick={confirmParentCompletion}
              >
                Confirmar y completar todo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
