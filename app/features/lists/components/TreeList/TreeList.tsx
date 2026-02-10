"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  confirmParentAction,
  confirmUncheckParentAction,
  deleteItemAction,
  toggleItemAction,
} from "../../actions";
import Link from "../Link/Link";
import type { TreeMode, VisibleNode } from "../../types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import styles from "./TreeList.module.scss";

type TreeListProps = {
  nodes: VisibleNode[];
  mode: TreeMode;
  depth?: number;
};

type ParentModalAction =
  | {
      id: string;
      title: string;
      intent: "complete" | "uncheck";
    }
  | null;

type DeleteModalAction =
  | {
      id: string;
      title: string;
      hasChildren: boolean;
    }
  | null;

export default function TreeList({ nodes, mode, depth = 0 }: TreeListProps) {
  const [parentModalAction, setParentModalAction] = useState<ParentModalAction>(null);
  const [deleteModalAction, setDeleteModalAction] = useState<DeleteModalAction>(null);

  if (nodes.length === 0 && depth === 0) {
    return <div className={styles["tree-list__empty"]}>No hay ítems para mostrar en esta vista.</div>;
  }

  const closeParentModal = () => setParentModalAction(null);
  const closeDeleteModal = () => setDeleteModalAction(null);

  const parentAction =
    parentModalAction?.intent === "complete" ? confirmParentAction : confirmUncheckParentAction;

  return (
    <>
      <ul
        className={cn(
          styles["tree-list"],
          depth > 0 && styles["tree-list__branch"],
        )}
      >
        {nodes.map((node) => {
          const nextCompletedValue = node.completed ? "false" : "true";
          const hasVisibleChildren = node.children.length > 0;
          const needsCompleteConfirmation = hasVisibleChildren && !node.completed && !node.isContextOnly;
          const needsUncheckConfirmation =
            mode === "completed" &&
            hasVisibleChildren &&
            (node.completed || node.isPartiallyCompleted);
          const addChildLink = `/?addChild=${encodeURIComponent(node.id)}`;
          const checkboxState: boolean | "indeterminate" = node.completed
            ? true
            : node.isPartiallyCompleted
              ? "indeterminate"
              : false;
          const toggleFormId = `toggle-item-${node.id}`;

          return (
            <li key={node.id}>
              <div
                className={cn(
                  styles["tree-list__row"],
                  node.isContextOnly && styles["tree-list__row--context"],
                )}
              >
                {needsUncheckConfirmation ? (
                  <span className={styles["tree-list__confirm-trigger"]}>
                    <Checkbox
                      checked={checkboxState}
                      aria-label={`Cambiar estado de ${node.title}`}
                      className={styles["tree-list__checkbox"]}
                      onCheckedChange={() =>
                        setParentModalAction({
                          id: node.id,
                          title: node.title,
                          intent: "uncheck",
                        })}
                    />
                  </span>
                ) : node.isContextOnly ? (
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
                ) : needsCompleteConfirmation ? (
                  <span className={styles["tree-list__confirm-trigger"]}>
                    <Checkbox
                      checked={checkboxState}
                      aria-label={`Cambiar estado de ${node.title}`}
                      className={styles["tree-list__checkbox"]}
                      onCheckedChange={() =>
                        setParentModalAction({
                          id: node.id,
                          title: node.title,
                          intent: "complete",
                        })}
                    />
                  </span>
                ) : (
                  <form
                    id={toggleFormId}
                    action={toggleItemAction}
                    className={styles["tree-list__toggle-form"]}
                  >
                    <input type="hidden" name="id" value={node.id} />
                    <input type="hidden" name="nextCompleted" value={nextCompletedValue} />
                    <Checkbox
                      checked={checkboxState}
                      aria-label={`Cambiar estado de ${node.title}`}
                      className={styles["tree-list__checkbox"]}
                      onCheckedChange={() => {
                        const form = document.getElementById(toggleFormId) as HTMLFormElement | null;
                        form?.requestSubmit();
                      }}
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
                  <div className={styles["tree-list__actions"]}>
                    <Link
                      href={addChildLink}
                      aria-label={`Agregar hijo a ${node.title}`}
                      className={styles["tree-list__add-child-link"]}
                    >
                      +
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Abrir acciones de ${node.title}`}
                          className={styles["tree-list__actions-trigger"]}
                        >
                          <MoreVertical className={styles["tree-list__actions-trigger-icon"]} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          aria-label={`Eliminar ${node.title}`}
                          onSelect={(event) => {
                            event.preventDefault();
                            setDeleteModalAction({
                              id: node.id,
                              title: node.title,
                              hasChildren: node.children.length > 0,
                            });
                          }}
                        >
                          <Trash2 className={styles["tree-list__delete-icon"]} />
                          Eliminar ítem
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              {node.children.length > 0 ? (
                <TreeList nodes={node.children} mode={mode} depth={depth + 1} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <Dialog
        open={Boolean(parentModalAction)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeParentModal();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentModalAction?.intent === "complete" ? "Completar ítem padre" : "Desmarcar ítem padre"}
            </DialogTitle>
            <DialogDescription>
              {parentModalAction ? (
                parentModalAction.intent === "complete" ? (
                  <>
                    Vas a completar <strong>{parentModalAction.title}</strong> y todos sus descendientes.
                    ¿Querés continuar?
                  </>
                ) : (
                  <>
                    Vas a desmarcar <strong>{parentModalAction.title}</strong> y todos sus descendientes.
                    ¿Querés continuar?
                  </>
                )
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {parentModalAction ? (
              <form action={parentAction}>
                <input type="hidden" name="id" value={parentModalAction.id} />
                <Button type="submit">
                  {parentModalAction.intent === "complete"
                    ? "Confirmar y completar todo"
                    : "Confirmar y desmarcar"}
                </Button>
              </form>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteModalAction)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeDeleteModal();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ítem</DialogTitle>
            <DialogDescription>
              {deleteModalAction ? (
                deleteModalAction.hasChildren ? (
                  <>
                    Se eliminará el ítem <strong>{deleteModalAction.title}</strong> y también se
                    eliminarán todos sus descendientes. Esta acción no se puede deshacer.
                  </>
                ) : (
                  <>
                    Se eliminará el ítem <strong>{deleteModalAction.title}</strong>. Esta acción no
                    se puede deshacer.
                  </>
                )
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {deleteModalAction ? (
              <form action={deleteItemAction}>
                <input type="hidden" name="id" value={deleteModalAction.id} />
                <Button type="submit" variant="destructive">
                  Confirmar eliminación
                </Button>
              </form>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
