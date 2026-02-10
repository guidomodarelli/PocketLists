"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  confirmParentAction,
  confirmUncheckParentAction,
  createItemAction,
  deleteItemAction,
  editItemTitleAction,
  toggleItemAction,
} from "../../actions";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  const [editingItem, setEditingItem] = useState<{ id: string; title: string } | null>(null);
  const [draftRootTitle, setDraftRootTitle] = useState<string | null>(null);
  const [draftChild, setDraftChild] = useState<{ parentId: string; title: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const draftRootInputRef = useRef<HTMLInputElement | null>(null);
  const draftChildInputRef = useRef<HTMLInputElement | null>(null);
  const ignoreBlurUntilRef = useRef(0);
  const ignoreDraftRootBlurUntilRef = useRef(0);
  const ignoreDraftBlurUntilRef = useRef(0);
  const editingItemId = editingItem?.id;
  const hasDraftRoot = draftRootTitle !== null;
  const draftChildParentId = draftChild?.parentId;

  useLayoutEffect(() => {
    if (!editingItemId) {
      return;
    }

    const focusWithRetry = (attempt = 0) => {
      const input = editInputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);

      if (document.activeElement !== input && attempt < 3) {
        window.requestAnimationFrame(() => focusWithRetry(attempt + 1));
      }
    };

    const frameId = window.requestAnimationFrame(() => focusWithRetry());
    return () => window.cancelAnimationFrame(frameId);
  }, [editingItemId]);

  useLayoutEffect(() => {
    if (!hasDraftRoot) {
      return;
    }

    const focusWithRetry = (attempt = 0) => {
      const input = draftRootInputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);

      if (document.activeElement !== input && attempt < 3) {
        window.requestAnimationFrame(() => focusWithRetry(attempt + 1));
      }
    };

    const frameId = window.requestAnimationFrame(() => focusWithRetry());
    return () => window.cancelAnimationFrame(frameId);
  }, [hasDraftRoot]);

  useLayoutEffect(() => {
    if (!draftChildParentId) {
      return;
    }

    const focusWithRetry = (attempt = 0) => {
      const input = draftChildInputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);

      if (document.activeElement !== input && attempt < 3) {
        window.requestAnimationFrame(() => focusWithRetry(attempt + 1));
      }
    };

    const frameId = window.requestAnimationFrame(() => focusWithRetry());
    return () => window.cancelAnimationFrame(frameId);
  }, [draftChildParentId]);

  useEffect(() => {
    if (mode !== "pending" || depth !== 0) {
      return;
    }

    const handleAddRootDraft = () => {
      ignoreDraftRootBlurUntilRef.current = Date.now() + 250;
      setEditingItem(null);
      setDraftChild(null);
      setDraftRootTitle("");
    };

    window.addEventListener("lists:add-root-draft", handleAddRootDraft);
    return () => window.removeEventListener("lists:add-root-draft", handleAddRootDraft);
  }, [mode, depth]);

  if (nodes.length === 0 && depth === 0 && !hasDraftRoot) {
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
        {mode === "pending" && depth === 0 && hasDraftRoot ? (
          <li>
            <div className={styles["tree-list__row"]}>
              <span className={styles["tree-list__context-checkbox"]} aria-hidden>
                <Checkbox
                  checked={false}
                  disabled
                  tabIndex={-1}
                  className={cn(
                    styles["tree-list__checkbox"],
                    styles["tree-list__checkbox--readonly"],
                  )}
                />
              </span>
              <div className={styles["tree-list__content"]}>
                <div className={styles["tree-list__text-wrap"]}>
                  <form
                    action={createItemAction}
                    className={styles["tree-list__edit-form"]}
                    onBlur={(event) => {
                      if (Date.now() < ignoreDraftRootBlurUntilRef.current) {
                        return;
                      }
                      const nextFocused = event.relatedTarget as Node | null;
                      if (nextFocused && event.currentTarget.contains(nextFocused)) {
                        return;
                      }
                      setDraftRootTitle(null);
                    }}
                  >
                    <InputGroup className={styles["tree-list__edit-input-group"]}>
                      <InputGroupInput
                        ref={draftRootInputRef}
                        name="title"
                        value={draftRootTitle ?? ""}
                        onChange={(event) => setDraftRootTitle(event.target.value)}
                        className={styles["tree-list__edit-input"]}
                        placeholder="Nuevo ítem"
                        required
                        autoFocus
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="submit"
                          size="sm"
                          className={styles["tree-list__edit-save"]}
                        >
                          Guardar
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </form>
                </div>
              </div>
            </div>
          </li>
        ) : null}
        {nodes.map((node) => {
          const nextCompletedValue = node.completed ? "false" : "true";
          const hasVisibleChildren = node.children.length > 0;
          const needsCompleteConfirmation = hasVisibleChildren && !node.completed && !node.isContextOnly;
          const needsUncheckConfirmation =
            mode === "completed" &&
            hasVisibleChildren &&
            (node.completed || node.isPartiallyCompleted);
          const checkboxState: boolean | "indeterminate" = node.completed
            ? true
            : node.isPartiallyCompleted
              ? "indeterminate"
              : false;
          const toggleFormId = `toggle-item-${node.id}`;
          const isEditing = editingItem?.id === node.id;
          const isAddingDraftChild = draftChild?.parentId === node.id;

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
                    {isEditing ? (
                      <form
                        action={editItemTitleAction}
                        className={styles["tree-list__edit-form"]}
                        onBlur={(event) => {
                          if (Date.now() < ignoreBlurUntilRef.current) {
                            return;
                          }
                          const nextFocused = event.relatedTarget as Node | null;
                          if (nextFocused && event.currentTarget.contains(nextFocused)) {
                            return;
                          }
                          setEditingItem(null);
                        }}
                      >
                        <input type="hidden" name="id" value={node.id} />
                        <InputGroup className={styles["tree-list__edit-input-group"]}>
                          <InputGroupInput
                            ref={editInputRef}
                            name="title"
                            value={editingItem.title}
                            onChange={(event) => {
                              setEditingItem((current) =>
                                current && current.id === node.id
                                  ? { ...current, title: event.target.value }
                                  : current
                              );
                            }}
                            className={styles["tree-list__edit-input"]}
                            required
                            autoFocus
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="submit"
                              size="sm"
                              className={styles["tree-list__edit-save"]}
                            >
                              Guardar
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </form>
                    ) : (
                      <p
                        className={cn(
                          styles["tree-list__title"],
                          node.completed && styles["tree-list__title--completed"],
                        )}
                      >
                        {node.title}
                      </p>
                    )}
                    {mode === "completed" && node.isContextOnly ? (
                      <p className={styles["tree-list__context-label"]}>Contexto de ruta (pendiente)</p>
                    ) : null}
                  </div>
                  <div className={styles["tree-list__actions"]}>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Agregar hijo a ${node.title}`}
                      className={styles["tree-list__add-child-link"]}
                      disabled={Boolean(editingItem) || Boolean(draftChild) || hasDraftRoot}
                      onClick={() => {
                        ignoreDraftBlurUntilRef.current = Date.now() + 250;
                        setEditingItem(null);
                        setDraftChild({ parentId: node.id, title: "" });
                      }}
                    >
                      +
                    </Button>
                    {!isEditing ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={`Abrir acciones de ${node.title}`}
                            className={styles["tree-list__actions-trigger"]}
                            disabled={
                              hasDraftRoot ||
                              Boolean(draftChild) ||
                              (editingItem ? editingItem.id !== node.id : false)
                            }
                          >
                            <MoreVertical className={styles["tree-list__actions-trigger-icon"]} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onCloseAutoFocus={(event) => event.preventDefault()}
                        >
                          <DropdownMenuItem
                            aria-label={`Editar ${node.title}`}
                            onSelect={() => {
                              ignoreBlurUntilRef.current = Date.now() + 250;
                              setEditingItem({ id: node.id, title: node.title });
                              window.setTimeout(() => {
                                const input = editInputRef.current;
                                if (!input) {
                                  return;
                                }
                                input.focus();
                                const end = input.value.length;
                                input.setSelectionRange(end, end);
                              }, 60);
                            }}
                          >
                            <Pencil className={styles["tree-list__edit-icon"]} />
                            Editar ítem
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            aria-label={`Eliminar ${node.title}`}
                            onSelect={() => {
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
                    ) : null}
                  </div>
                </div>
              </div>
              {isAddingDraftChild ? (
                <ul className={cn(styles["tree-list"], styles["tree-list__branch"])}>
                  <li>
                    <div className={styles["tree-list__row"]}>
                      <span className={styles["tree-list__context-checkbox"]} aria-hidden>
                        <Checkbox
                          checked={false}
                          disabled
                          tabIndex={-1}
                          className={cn(
                            styles["tree-list__checkbox"],
                            styles["tree-list__checkbox--readonly"],
                          )}
                        />
                      </span>
                      <div className={styles["tree-list__content"]}>
                        <div className={styles["tree-list__text-wrap"]}>
                          <form
                            action={createItemAction}
                            className={styles["tree-list__edit-form"]}
                            onBlur={(event) => {
                              if (Date.now() < ignoreDraftBlurUntilRef.current) {
                                return;
                              }
                              const nextFocused = event.relatedTarget as Node | null;
                              if (nextFocused && event.currentTarget.contains(nextFocused)) {
                                return;
                              }
                              setDraftChild(null);
                            }}
                          >
                            <input type="hidden" name="parentId" value={node.id} />
                            <InputGroup className={styles["tree-list__edit-input-group"]}>
                              <InputGroupInput
                                ref={draftChildInputRef}
                                name="title"
                                value={draftChild.title}
                                onChange={(event) => {
                                  setDraftChild((current) =>
                                    current && current.parentId === node.id
                                      ? { ...current, title: event.target.value }
                                      : current
                                  );
                                }}
                                className={styles["tree-list__edit-input"]}
                                placeholder="Nuevo hijo"
                                required
                                autoFocus
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  type="submit"
                                  size="sm"
                                  className={styles["tree-list__edit-save"]}
                                >
                                  Guardar
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </form>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              ) : null}
              {node.children.length > 0 ? <TreeList nodes={node.children} mode={mode} depth={depth + 1} /> : null}
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
