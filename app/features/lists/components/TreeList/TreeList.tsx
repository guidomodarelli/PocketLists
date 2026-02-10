import { toggleItemAction } from "../../actions";
import Link from "../Link/Link";
import type { TreeMode, VisibleNode } from "../../types";
import { joinClasses } from "@/app/lib/joinClasses";
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
      className={joinClasses(
        styles["tree-list"],
        depth > 0 && styles["tree-list__branch"],
      )}
    >
      {nodes.map((node) => {
        const nextCompletedValue = node.completed ? "false" : "true";
        const needsConfirmation = node.children.length > 0 && !node.completed;
        const confirmLink = `/?confirm=${encodeURIComponent(node.id)}`;
        const addChildLink = `/?addChild=${encodeURIComponent(node.id)}`;

        return (
          <li key={node.id}>
            <div
              className={joinClasses(
                styles["tree-list__row"],
                node.isContextOnly && styles["tree-list__row--context"],
              )}
            >
              {node.isContextOnly ? (
                <span className={styles["tree-list__context-checkbox"]} aria-hidden />
              ) : needsConfirmation ? (
                <Link
                  href={confirmLink}
                  role="checkbox"
                  aria-checked={node.completed}
                  aria-label={`Cambiar estado de ${node.title}`}
                  className={styles["tree-list__confirm-link"]}
                >
                  <span aria-hidden className={styles["tree-list__confirm-icon"]} />
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
                    className={joinClasses(
                      styles["tree-list__toggle-button"],
                      node.completed && styles["tree-list__toggle-button--completed"],
                    )}
                  >
                    <span
                      aria-hidden
                      className={joinClasses(
                        styles["tree-list__toggle-icon"],
                        node.completed && styles["tree-list__toggle-icon--completed"],
                      )}
                    />
                  </button>
                </form>
              )}
              <div className={styles["tree-list__content"]}>
                <div className={styles["tree-list__text-wrap"]}>
                  <p
                    className={joinClasses(
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
