"use client";

import { useState } from "react";
import { createItemAction } from "../../actions";
import type { ParentOption } from "../../types";
import ParentSelector from "../ParentSelector/ParentSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import styles from "./AddItemModal.module.scss";

type AddItemModalProps = {
  parentOptions: ParentOption[];
};

export default function AddItemModal({ parentOptions }: AddItemModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className={styles["add-item-modal__trigger"]}>
          Agregar ítem
        </Button>
      </DialogTrigger>
      <DialogContent className={styles["add-item-modal__content"]}>
        <DialogHeader>
          <DialogTitle>Agregar ítem</DialogTitle>
          <DialogDescription>
            Completá los datos para agregar un nuevo ítem a la lista.
          </DialogDescription>
        </DialogHeader>
        <form action={createItemAction} className={styles["add-item-modal__form"]}>
          <div className={styles["add-item-modal__field"]}>
            <label className={styles["add-item-modal__label"]} htmlFor="new-item-title-modal">
              Título del ítem
            </label>
            <input
              id="new-item-title-modal"
              name="title"
              required
              autoFocus
              placeholder="Ej: Linterna"
              className={styles["add-item-modal__input"]}
            />
          </div>
          <ParentSelector
            options={parentOptions}
            name="parentId"
            label="Agregar como hijo de"
            placeholder="Buscá un ítem existente"
            helpText="Opcional. Si no elegís padre, se agrega como raíz."
          />
          <DialogFooter className={styles["add-item-modal__actions"]}>
            <Button type="submit" className={styles["add-item-modal__submit"]}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
