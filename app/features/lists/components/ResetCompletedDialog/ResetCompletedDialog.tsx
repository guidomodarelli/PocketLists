"use client";

import type { ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import styles from "./ResetCompletedDialog.module.scss";

type ResetCompletedDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export default function ResetCompletedDialog({
  open,
  onOpenChange,
  children,
}: ResetCompletedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className={styles["reset-completed-dialog"]}>{children}</div>
    </Dialog>
  );
}
