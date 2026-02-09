"use client";

import { useId, useMemo, useState } from "react";
import type { OpcionPadre } from "../types";

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
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        id={inputId}
        list={datalistId}
        value={texto}
        onChange={(event) => actualizarSeleccion(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
      <datalist id={datalistId}>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.etiqueta} />
        ))}
      </datalist>
      <input type="hidden" name={name} value={idSeleccionado} />
      {ayuda ? <p className="text-xs text-slate-500">{ayuda}</p> : null}
    </div>
  );
}
