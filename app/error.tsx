"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-rose-200 bg-rose-50/70 p-6 shadow-xl shadow-slate-200/70">
        <h2 className="text-lg font-semibold text-rose-900">Ocurrió un error al cargar las listas</h2>
        <p className="mt-2 text-sm text-rose-700">
          Volvé a intentarlo o recargá la página si el problema persiste.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
