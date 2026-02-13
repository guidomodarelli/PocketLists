"use client";

import Link from "../Link/Link";
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
};

export default function CompletedItemsDialog({
  nodes,
  completedCount,
  canResetCompleted,
  listId,
}: CompletedItemsDialogProps) {
  const listPath = `/lists/${encodeURIComponent(listId)}`;
  const dialogStateKey = canResetCompleted ? "with-completed-items" : "without-completed-items";

  return (
    <Dialog key={dialogStateKey}>
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
            <Link href={`${listPath}?confirmReset=true`} className={styles["completed-items-dialog__reset-link"]}>
              Desmarcar completados
            </Link>
          </div>
        ) : null}
        <div className={styles["completed-items-dialog__list"]}>
          <TreeList nodes={nodes} mode="completed" listId={listId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
