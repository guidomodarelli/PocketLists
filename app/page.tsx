import type { ReactNode } from "react";
import { headers } from "next/headers";
import TreeList from "@/app/features/lists/components/TreeList";
import Link from "@/app/features/lists/components/Link";
import type { ApiError, ItemNode, ListsResponse } from "@/app/features/lists/types";
import { buildVisibleTree, countByStatus, findNode } from "@/app/features/lists/tree";
import { confirmParentAction, resetCompletedAction } from "@/app/features/lists/actions";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

type FetchResult = { items: ItemNode[] } | { error: string; details?: string };

async function getBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function getSingleParam(searchParams: SearchParams | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveActionError(errorParam?: string): { title: string; description: string } | null {
  if (!errorParam) {
    return null;
  }

  if (errorParam === "accion") {
    return {
      title: "No pudimos actualizar el estado.",
      description: "Reintentá la acción o recargá la página para sincronizar los datos.",
    };
  }

  return {
    title: "Ocurrió un error inesperado.",
    description: "Volvé a intentarlo en unos segundos.",
  };
}

async function fetchLists(): Promise<FetchResult> {
  const baseUrl = await getBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/lists`, {
      next: { tags: ["lists"] },
    });
    const data = (await response.json().catch(() => null)) as ListsResponse | ApiError | null;

    if (!response.ok) {
      const apiError = data as ApiError | null;
      return {
        error: apiError?.error ?? "No se pudieron obtener las listas.",
        details: apiError?.details ?? "Intentá recargar la página.",
      };
    }

    return { items: (data as ListsResponse).items ?? [] };
  } catch (error) {
    return {
      error: "No se pudieron obtener las listas.",
      details: "Intentá recargar la página. Si el problema persiste, probá más tarde.",
    };
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8">
      <main className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-sm sm:p-8">
        {children}
      </main>
    </div>
  );
}

function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-900">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-rose-700">{description}</p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
      >
        Reintentar
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
      Todavía no hay listas para mostrar. Probá cargar datos o actualizá la página.
    </div>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const result = await fetchLists();
  const errorParam = getSingleParam(resolvedSearchParams, "error");
  const actionError = resolveActionError(errorParam);

  if ("error" in result) {
    return (
      <PageShell>
        <ErrorState title={result.error} description={result.details ?? "Intentá nuevamente."} />
      </PageShell>
    );
  }

  const items = result.items;
  const confirmId = getSingleParam(resolvedSearchParams, "confirm");
  const nodeForConfirmation = confirmId ? findNode(items, confirmId) : undefined;
  const confirmationMissing = Boolean(confirmId && !nodeForConfirmation);
  const confirmReset = getSingleParam(resolvedSearchParams, "confirmReset");
  const shouldConfirmReset = confirmReset === "true";

  if (items.length === 0) {
    return (
      <PageShell>
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Lista de viaje</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
        </header>
        <EmptyState />
      </PageShell>
    );
  }

  const pendingTree = buildVisibleTree(items, "pending");
  const completedTree = buildVisibleTree(items, "completed");
  const pendingCount = countByStatus(items, false);
  const completedCount = countByStatus(items, true);
  const canResetCompleted = completedCount > 0;
  const resetConfirmationUnavailable = shouldConfirmReset && !canResetCompleted;
  const showResetModal = shouldConfirmReset && canResetCompleted && !confirmId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8">
      <main className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Lista de viaje</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              Pendientes: {pendingCount}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
              Completados: {completedCount}
            </span>
          </div>
        </header>

        {actionError ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-900">
            <h2 className="text-base font-semibold">{actionError.title}</h2>
            <p className="mt-1 text-rose-700">{actionError.description}</p>
          </div>
        ) : null}

        {confirmationMissing ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            No encontramos el ítem que querías confirmar. Probá actualizar la página.
          </div>
        ) : null}

        {resetConfirmationUnavailable ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            No hay ítems completados para desmarcar. Probá actualizar la página.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Pendientes</h2>
            <TreeList nodes={pendingTree} mode="pending" />
          </section>

          <section className="rounded-xl border border-slate-200 bg-emerald-50/60 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Completados</h2>
              {canResetCompleted ? (
                <Link
                  href="/?confirmReset=true"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Desmarcar completados
                </Link>
              ) : null}
            </div>
            <TreeList nodes={completedTree} mode="completed" />
          </section>
        </div>
      </main>

      {showResetModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Desmarcar completados</h3>
            <p className="mt-3 text-sm text-slate-600">
              Vas a desmarcar todos los ítems completados. ¿Querés continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </Link>
              <form action={resetCompletedAction}>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-950"
                >
                  Confirmar y desmarcar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {confirmId && nodeForConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Completar ítem padre</h3>
            <p className="mt-3 text-sm text-slate-600">
              Vas a completar <strong>{nodeForConfirmation.title}</strong> y todos sus descendientes.
              ¿Querés continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </Link>
              <form action={confirmParentAction}>
                <input type="hidden" name="id" value={nodeForConfirmation.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Confirmar y completar todo
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
