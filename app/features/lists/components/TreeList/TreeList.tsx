import { toggleItemAction } from "../../actions";
import Link from "../Link/Link";
import type { TreeMode, VisibleNode } from "../../types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import styles from "./TreeList.module.scss";

type TreeListProps = {
  nodes: VisibleNode[];
  mode: TreeMode;
  depth?: number;
};

export default function TreeList({ nodes, mode, depth = 0 }: TreeListProps) {
  if (nodes.length === 0 && depth === 0) {
    return <div className={styles["tree-list__empty"]}>No hay ítems para mostrar en esta vista.</div>;
  }

  return (
    <ul
      className={cn(
        styles["tree-list"],
        depth > 0 && styles["tree-list__branch"],
      )}
    >
      {nodes.map((node) => {
        const nextCompletedValue = node.completed ? "false" : "true";
        const needsConfirmation = node.children.length > 0 && !node.completed;
        const addChildLink = `/?addChild=${encodeURIComponent(node.id)}`;
        const checkboxState: boolean | "indeterminate" = node.completed
          ? true
          : node.isPartiallyCompleted
            ? "indeterminate"
            : false;

        return (
          <li key={node.id}>
            <div
              className={cn(
                styles["tree-list__row"],
                node.isContextOnly && styles["tree-list__row--context"],
              )}
            >
              {node.isContextOnly ? (
                <span className={styles["tree-list__context-checkbox"]} aria-hidden>
                  <Checkbox
                    checked={checkboxState}
                    disabled
                    tabIndex={-1}
                    className={cn(
                      styles["tree-list__checkbox"],
                      styles["tree-list__checkbox--readonly"],
                    )}
                  />
                </span>
              ) : needsConfirmation ? (
                <form action="/" method="get" className={styles["tree-list__confirm-form"]}>
                  <input type="hidden" name="confirm" value={node.id} />
                  <Checkbox
                    type="submit"
                    checked={checkboxState}
                    aria-label={`Cambiar estado de ${node.title}`}
                    className={styles["tree-list__checkbox"]}
                  />
                </form>
              ) : (
                <form action={toggleItemAction} className={styles["tree-list__toggle-form"]}>
                  <input type="hidden" name="id" value={node.id} />
                  <input type="hidden" name="nextCompleted" value={nextCompletedValue} />
                  <Checkbox
                    type="submit"
                    checked={checkboxState}
                    aria-label={`Cambiar estado de ${node.title}`}
                    className={styles["tree-list__checkbox"]}
                  />
                </form>
              )}
              <div className={styles["tree-list__content"]}>
                <div className={styles["tree-list__text-wrap"]}>
                  <p
                    className={cn(
                      styles["tree-list__title"],
                      node.completed && styles["tree-list__title--completed"],
                    )}
                  >
                    {node.title}
                  </p>
                  {mode === "completed" && node.isContextOnly ? (
                    <p className={styles["tree-list__context-label"]}>Contexto de ruta (pendiente)</p>
                  ) : null}
                </div>
                <Link
                  href={addChildLink}
                  aria-label={`Agregar hijo a ${node.title}`}
                  className={styles["tree-list__add-child-link"]}
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
