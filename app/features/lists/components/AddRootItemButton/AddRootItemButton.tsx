"use client";

import { Button } from "@/components/ui/button";
import styles from "./AddRootItemButton.module.scss";

export default function AddRootItemButton() {
  return (
    <Button
      type="button"
      className={styles["add-root-item-button__trigger"]}
      onClick={() => window.dispatchEvent(new CustomEvent("lists:add-root-draft"))}
    >
      Agregar ítem
    </Button>
  );
}
