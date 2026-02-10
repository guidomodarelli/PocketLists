"use client";

import { useId, useMemo, useState } from "react";
import type { OpcionPadre } from "../../types";
import styles from "./SelectorPadre.module.scss";

type SelectorPadreProps = {
  opciones: OpcionPadre[];
  name: string;
  label: string;
  placeholder?: string;
  ayuda?: string;
};

export default function SelectorPadre({
  opciones,
  name,
  label,
  placeholder,
  ayuda,
}: SelectorPadreProps) {
  const inputId = useId();
  const datalistId = useId();
  const [texto, setTexto] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState("");

  const opcionesPorEtiqueta = useMemo(() => {
    return new Map(opciones.map((opcion) => [opcion.etiqueta, opcion.id]));
  }, [opciones]);

  const actualizarSeleccion = (valor: string) => {
    setTexto(valor);
    setIdSeleccionado(opcionesPorEtiqueta.get(valor) ?? "");
  };

  return (
    <div className={styles["selector-padre"]}>
      <label htmlFor={inputId} className={styles["selector-padre__label"]}>
        {label}
      </label>
      <input
        id={inputId}
        list={datalistId}
        value={texto}
        onChange={(event) => actualizarSeleccion(event.target.value)}
        placeholder={placeholder}
        className={styles["selector-padre__input"]}
      />
      <datalist id={datalistId}>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.etiqueta} />
        ))}
      </datalist>
      <input type="hidden" name={name} value={idSeleccionado} />
      {ayuda ? <p className={styles["selector-padre__help"]}>{ayuda}</p> : null}
    </div>
  );
}
