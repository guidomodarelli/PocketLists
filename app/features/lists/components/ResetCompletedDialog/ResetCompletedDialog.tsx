"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import styles from "./ResetCompletedDialog.module.scss";

type ResetCompletedDialogProps = {
  open: boolean;
  dismissHref: string;
  children: ReactNode;
};

export default function ResetCompletedDialog({
  open,
  dismissHref,
  children,
}: ResetCompletedDialogProps) {
  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      router.replace(dismissHref, { scroll: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className={styles["reset-completed-dialog"]}>{children}</div>
    </Dialog>
  );
}
