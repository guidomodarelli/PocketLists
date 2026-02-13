"use client";

import { Button } from "@/components/ui/button";
import styles from "./AddRootItemButton.module.scss";

type AddRootItemButtonProps = {
  listId: string;
};

export default function AddRootItemButton({ listId }: AddRootItemButtonProps) {
  return (
    <Button
      type="button"
      className={styles["add-root-item-button__trigger"]}
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("lists:add-root-draft", {
            detail: { listId },
          })
        )}
    >
      Agregar ítem
    </Button>
  );
}
