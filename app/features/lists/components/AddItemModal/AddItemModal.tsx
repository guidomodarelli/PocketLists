"use client";

import { Button } from "@/components/ui/button";
import styles from "./AddItemModal.module.scss";

export default function AddItemModal() {
  return (
    <Button
      type="button"
      className={styles["add-item-modal__trigger"]}
      onClick={() => window.dispatchEvent(new CustomEvent("lists:add-root-draft"))}
    >
      Agregar ítem
    </Button>
  );
}
