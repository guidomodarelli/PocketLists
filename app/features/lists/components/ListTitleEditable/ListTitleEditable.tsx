"use client";

import { useEffect, useRef, useState } from "react";
import { editListTitleAction } from "../../actions";
import { cn } from "@/lib/utils";
import styles from "./ListTitleEditable.module.scss";

type ListTitleEditableProps = {
  listId: string;
  title: string;
  className?: string;
};

export default function ListTitleEditable({ listId, title, className }: ListTitleEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isEscCancelRef = useRef(false);
  const normalizedTitle = title.trim();
  const isPlaceholder = normalizedTitle.length === 0;
  const visibleTitle = isPlaceholder ? "(Sin nombre)" : title;

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [isEditing]);

  return (
    <h1 className={cn(styles["list-title-editable"], className)}>
      {isEditing ? (
        <form ref={formRef} action={editListTitleAction} className={styles["list-title-editable__form"]}>
          <input type="hidden" name="listId" value={listId} />
          <input
            ref={inputRef}
            name="title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className={styles["list-title-editable__input"]}
            aria-label="Editar nombre de lista"
            onKeyDown={(event) => {
              if (event.key !== "Escape") {
                return;
              }

              event.preventDefault();
              isEscCancelRef.current = true;
              setDraftTitle(title);
              setIsEditing(false);
            }}
            onBlur={() => {
              if (isEscCancelRef.current) {
                isEscCancelRef.current = false;
                return;
              }

              const nextTitle = draftTitle.trim();
              if (nextTitle === normalizedTitle) {
                setDraftTitle(title);
                setIsEditing(false);
                return;
              }

              setIsEditing(false);
              formRef.current?.requestSubmit();
            }}
            autoFocus
          />
        </form>
      ) : (
        <button
          type="button"
          className={cn(
            styles["list-title-editable__trigger"],
            isPlaceholder && styles["list-title-editable__trigger--placeholder"]
          )}
          onClick={() => {
            isEscCancelRef.current = false;
            setDraftTitle(title);
            setIsEditing(true);
          }}
        >
          {visibleTitle}
        </button>
      )}
    </h1>
  );
}
