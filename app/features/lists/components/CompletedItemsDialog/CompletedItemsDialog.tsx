"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  openOnLoad?: boolean;
  onToggleItem?: (listId: string, id: string, nextCompleted: boolean) => Promise<unknown> | unknown;
  onConfirmParent?: (listId: string, id: string) => Promise<unknown> | unknown;
  onConfirmUncheckParent?: (
    listId: string,
    id: string,
    reopenCompletedDialog: boolean
  ) => Promise<unknown> | unknown;
  onCreateItem?: (listId: string, title: string, parentId?: string) => Promise<unknown> | unknown;
  onDeleteItem?: (listId: string, id: string) => Promise<unknown> | unknown;
  onEditItemTitle?: (listId: string, id: string, title: string) => Promise<unknown> | unknown;
};

export default function CompletedItemsDialog({
  nodes,
  completedCount,
  canResetCompleted,
  listId,
  openOnLoad = false,
  onToggleItem = () => undefined,
  onConfirmParent = () => undefined,
  onConfirmUncheckParent = () => undefined,
  onCreateItem = () => undefined,
  onDeleteItem = () => undefined,
  onEditItemTitle = () => undefined,
}: CompletedItemsDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listPath = `/lists/${encodeURIComponent(listId)}`;
  const dialogStateKey = [
    canResetCompleted ? "with-completed-items" : "without-completed-items",
    openOnLoad ? "open-on-load" : "manual-open",
  ].join("-");
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen || !searchParams?.has("openCompleted")) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("openCompleted");
    const nextQuery = nextSearchParams.toString();
    const nextPathname = pathname || listPath;
    const nextHref = nextQuery.length > 0 ? `${nextPathname}?${nextQuery}` : nextPathname;
    router.replace(nextHref, { scroll: false });
  };

  return (
    <Dialog key={dialogStateKey} defaultOpen={openOnLoad} onOpenChange={handleOpenChange}>
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
