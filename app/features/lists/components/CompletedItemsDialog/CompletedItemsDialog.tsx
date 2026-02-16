"use client";

import { useState } from "react";
import TreeList from "../TreeList/TreeList";
import type { VisibleNode } from "../../types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import styles from "./CompletedItemsDialog.module.scss";

type CompletedItemsDialogProps = {
  nodes: VisibleNode[];
  completedCount: number;
  canResetCompleted: boolean;
  listId: string;
  onToggleItem?: (listId: string, id: string, nextCompleted: boolean) => Promise<unknown> | unknown;
  onConfirmParent?: (listId: string, id: string) => Promise<unknown> | unknown;
  onConfirmUncheckParent?: (listId: string, id: string) => Promise<unknown> | unknown;
  onCreateItem?: (listId: string, title: string, parentId?: string) => Promise<unknown> | unknown;
  onDeleteItem?: (listId: string, id: string) => Promise<unknown> | unknown;
  onEditItemTitle?: (listId: string, id: string, title: string) => Promise<unknown> | unknown;
  onRequestResetCompleted?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function CompletedItemsDialog({
  nodes,
  completedCount,
  canResetCompleted,
  listId,
  onToggleItem = () => undefined,
  onConfirmParent = () => undefined,
  onConfirmUncheckParent = () => undefined,
  onCreateItem = () => undefined,
  onDeleteItem = () => undefined,
  onEditItemTitle = () => undefined,
  onRequestResetCompleted = () => undefined,
  open,
  onOpenChange,
}: CompletedItemsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={styles["completed-items-dialog__trigger"]}>
          Ver completados
        </Button>
      </DialogTrigger>
      <DialogContent className={styles["completed-items-dialog__content"]}>
        <DialogHeader>
          <DialogTitle>Completados</DialogTitle>
          <DialogDescription>
            Tenés {completedCount} ítems completados.
          </DialogDescription>
        </DialogHeader>
        {canResetCompleted ? (
          <div className={styles["completed-items-dialog__actions"]}>
            <Button
              type="button"
              variant="outline"
              className={styles["completed-items-dialog__reset-link"]}
              onClick={() => onRequestResetCompleted()}
            >
              Desmarcar completados
            </Button>
          </div>
        ) : null}
        <div className={styles["completed-items-dialog__list"]}>
          <TreeList
            nodes={nodes}
            mode="completed"
            listId={listId}
            onToggleItem={onToggleItem}
            onConfirmParent={onConfirmParent}
            onConfirmUncheckParent={onConfirmUncheckParent}
            onCreateItem={onCreateItem}
            onDeleteItem={onDeleteItem}
            onEditItemTitle={onEditItemTitle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
