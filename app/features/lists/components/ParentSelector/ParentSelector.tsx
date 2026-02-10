"use client";

import { useId, useMemo, useState } from "react";
import type { ParentOption } from "../../types";
import styles from "./ParentSelector.module.scss";

type ParentSelectorProps = {
  options: ParentOption[];
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
};

export default function ParentSelector({
  options,
  name,
  label,
  placeholder,
  helpText,
}: ParentSelectorProps) {
  const inputId = useId();
  const datalistId = useId();
  const [text, setText] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const optionsByLabel = useMemo(() => {
    return new Map(options.map((option) => [option.label, option.id]));
  }, [options]);

  const updateSelection = (value: string) => {
    setText(value);
    setSelectedId(optionsByLabel.get(value) ?? "");
  };

  return (
    <div className={styles["parent-selector"]}>
      <label htmlFor={inputId} className={styles["parent-selector__label"]}>
        {label}
      </label>
      <input
        id={inputId}
        list={datalistId}
        value={text}
        onChange={(event) => updateSelection(event.target.value)}
        placeholder={placeholder}
        className={styles["parent-selector__input"]}
      />
      <datalist id={datalistId}>
        {options.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>
      <input type="hidden" name={name} value={selectedId} />
      {helpText ? <p className={styles["parent-selector__help"]}>{helpText}</p> : null}
    </div>
  );
}
