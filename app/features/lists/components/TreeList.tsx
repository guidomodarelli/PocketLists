import { toggleItemAction } from "../actions";
import Link from "./Link";
import type { TreeMode, VisibleNode } from "../types";

type TreeListProps = {
  nodes: VisibleNode[];
  mode: TreeMode;
  depth?: number;
};

export default function TreeList({ nodes, mode, depth = 0 }: TreeListProps) {
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
        const nextCompletedValue = node.completed ? "false" : "true";
        const requiereConfirmacion = node.children.length > 0 && !node.completed;
        const enlaceConfirmacion = `/?confirm=${encodeURIComponent(node.id)}`;
        const enlaceAgregarHijo = `/?addChild=${encodeURIComponent(node.id)}`;

        return (
          <li key={node.id}>
            <div
              className={`flex items-start gap-3 rounded-lg px-2 py-1.5 transition ${
                node.isContextOnly ? "bg-slate-100/80" : "bg-white shadow-sm"
              }`}
            >
              {node.isContextOnly ? (
                <span className="mt-1 h-4 w-4 rounded border border-slate-300 bg-white" aria-hidden />
              ) : requiereConfirmacion ? (
                <Link
                  href={enlaceConfirmacion}
                  role="checkbox"
                  aria-checked={node.completed}
                  aria-label={`Cambiar estado de ${node.title}`}
                  className="mt-1 flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white transition"
                >
                  <span aria-hidden className="h-2 w-2 rounded-sm bg-transparent" />
                </Link>
              ) : (
                <form action={toggleItemAction}>
                  <input type="hidden" name="id" value={node.id} />
                  <input type="hidden" name="nextCompleted" value={nextCompletedValue} />
                  <button
                    type="submit"
                    role="checkbox"
                    aria-checked={node.completed}
                    aria-label={`Cambiar estado de ${node.title}`}
                    className={`mt-1 flex h-4 w-4 items-center justify-center rounded border transition ${
                      node.completed
                        ? "border-emerald-600 bg-emerald-600 shadow-sm shadow-emerald-500/40"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 rounded-sm ${
                        node.completed ? "bg-white" : "bg-transparent"
                      }`}
                    />
                  </button>
                </form>
              )}
              <div className="flex items-center gap-2 justify-between w-full">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${titleClasses}`}>{node.title}</p>
                  {mode === "completed" && node.isContextOnly ? (
                    <p className="text-xs text-slate-500">Contexto de ruta (pendiente)</p>
                  ) : null}
                </div>
                <Link
                  href={enlaceAgregarHijo}
                  aria-label={`Agregar hijo a ${node.title}`}
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  +
                </Link>
              </div>
            </div>
            {node.children.length > 0 ? (
              <TreeList nodes={node.children} mode={mode} depth={depth + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
