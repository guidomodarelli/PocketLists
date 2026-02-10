import { toggleItemAction } from "../../actions";
import Link from "../Link/Link";
import type { TreeMode, VisibleNode } from "../../types";
import styles from "./TreeList.module.scss";

type TreeListProps = {
  nodes: VisibleNode[];
  mode: TreeMode;
  depth?: number;
};

function unirClases(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function TreeList({ nodes, mode, depth = 0 }: TreeListProps) {
  if (nodes.length === 0 && depth === 0) {
    return <div className={styles["tree-list__empty"]}>No hay ítems para mostrar en esta vista.</div>;
  }

  return (
    <ul
      className={unirClases(
        styles["tree-list"],
        depth > 0 && styles["tree-list__branch"],
      )}
    >
      {nodes.map((node) => {
        const nextCompletedValue = node.completed ? "false" : "true";
        const requiereConfirmacion = node.children.length > 0 && !node.completed;
        const enlaceConfirmacion = `/?confirm=${encodeURIComponent(node.id)}`;
        const enlaceAgregarHijo = `/?addChild=${encodeURIComponent(node.id)}`;

        return (
          <li key={node.id}>
            <div
              className={unirClases(
                styles["tree-list__row"],
                node.isContextOnly && styles["tree-list__row--context"],
              )}
            >
              {node.isContextOnly ? (
                <span className={styles["tree-list__context-checkbox"]} aria-hidden />
              ) : requiereConfirmacion ? (
                <Link
                  href={enlaceConfirmacion}
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
                    className={unirClases(
                      styles["tree-list__toggle-button"],
                      node.completed && styles["tree-list__toggle-button--completed"],
                    )}
                  >
                    <span
                      aria-hidden
                      className={unirClases(
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
                    className={unirClases(
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
                  href={enlaceAgregarHijo}
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
