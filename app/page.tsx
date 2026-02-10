import type { ReactNode } from "react";
import { headers } from "next/headers";
import TreeList from "@/app/features/lists/components/TreeList/TreeList";
import Link from "@/app/features/lists/components/Link/Link";
import AddItemModal from "@/app/features/lists/components/AddItemModal/AddItemModal";
import CompletedItemsDialog from "@/app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog";
import type { ApiError, ItemNode, ListsResponse } from "@/app/features/lists/types";
import { buildVisibleTree, buildParentOptions, countByStatus, findNode } from "@/app/features/lists/tree";
import {
  confirmParentAction,
  confirmUncheckParentAction,
  resetCompletedAction,
} from "@/app/features/lists/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import styles from "./page.module.scss";

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

  if (errorParam === "action") {
    return {
      title: "No pudimos actualizar el estado.",
      description: "Reintentá la acción o recargá la página para sincronizar los datos.",
    };
  }

  if (errorParam === "add") {
    return {
      title: "No pudimos agregar el ítem.",
      description: "Revisá el título y el padre seleccionado, y volvé a intentarlo.",
    };
  }

  if (errorParam === "delete") {
    return {
      title: "No pudimos eliminar el ítem.",
      description: "Reintentá la eliminación o recargá la página para sincronizar los datos.",
    };
  }

  if (errorParam === "edit") {
    return {
      title: "No pudimos editar el ítem.",
      description: "Reintentá la edición o recargá la página para sincronizar los datos.",
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
  } catch {
    return {
      error: "No se pudieron obtener las listas.",
      details: "Intentá recargar la página. Si el problema persiste, probá más tarde.",
    };
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles["home-page"]}>
      <main className={styles["home-page__main"]}>
        {children}
      </main>
    </div>
  );
}

function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className={cn(styles["home-page__inline-state"], styles["home-page__inline-state--error"])}>
      <h2 className={styles["home-page__inline-state-title"]}>{title}</h2>
      <p className={styles["home-page__inline-state-description"]}>{description}</p>
      <Link
        href="/"
        className={styles["home-page__inline-state-link"]}
      >
        Reintentar
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles["home-page__empty-state"]}>
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
  const confirmUncheckId = getSingleParam(resolvedSearchParams, "confirmUncheck");
  const nodeForUncheckConfirmation = confirmUncheckId ? findNode(items, confirmUncheckId) : undefined;
  const uncheckConfirmationMissing = Boolean(confirmUncheckId && !nodeForUncheckConfirmation);
  const confirmReset = getSingleParam(resolvedSearchParams, "confirmReset");
  const shouldConfirmReset = confirmReset === "true";
  const parentOptions = buildParentOptions(items);

  if (items.length === 0) {
    return (
      <PageShell>
        <header className={styles["home-page__header"]}>
          <h1 className={styles["home-page__title"]}>Lista de viaje</h1>
          <p className={styles["home-page__subtitle"]}>
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
          <AddItemModal parentOptions={parentOptions} />
        </header>
        {actionError ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--error"])}>
            <h2 className={styles["home-page__banner-title"]}>{actionError.title}</h2>
            <p className={styles["home-page__banner-description"]}>{actionError.description}</p>
          </div>
        ) : null}
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
  const showResetModal = shouldConfirmReset && canResetCompleted && !confirmId && !confirmUncheckId;
  const showUncheckModal = Boolean(
    confirmUncheckId &&
      nodeForUncheckConfirmation &&
      nodeForUncheckConfirmation.children.length > 0 &&
      !confirmId &&
      !showResetModal
  );

  return (
    <div className={styles["home-page"]}>
      <main className={styles["home-page__main"]}>
        <header className={styles["home-page__header"]}>
          <h1 className={styles["home-page__title"]}>Lista de viaje</h1>
          <p className={styles["home-page__subtitle"]}>
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
          <div className={styles["home-page__badge-row"]}>
            <Badge
              className={cn(
                styles["home-page__badge"],
                styles["home-page__badge--pending"],
              )}
            >
              Pendientes: {pendingCount}
            </Badge>
            <Badge
              className={cn(
                styles["home-page__badge"],
                styles["home-page__badge--completed"],
              )}
            >
              Completados: {completedCount}
            </Badge>
          </div>
          <div className={styles["home-page__header-actions"]}>
            <AddItemModal parentOptions={parentOptions} />
            <CompletedItemsDialog
              nodes={completedTree}
              completedCount={completedCount}
              canResetCompleted={canResetCompleted}
            />
          </div>
        </header>

        {actionError ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--error"])}>
            <h2 className={styles["home-page__banner-title"]}>{actionError.title}</h2>
            <p className={styles["home-page__banner-description"]}>{actionError.description}</p>
          </div>
        ) : null}

        {confirmationMissing ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--warning"])}>
            No encontramos el ítem que querías confirmar. Probá actualizar la página.
          </div>
        ) : null}

        {uncheckConfirmationMissing ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--warning"])}>
            No encontramos el ítem que querías desmarcar. Probá actualizar la página.
          </div>
        ) : null}

        {resetConfirmationUnavailable ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--warning"])}>
            No hay ítems completados para desmarcar. Probá actualizar la página.
          </div>
        ) : null}

        <div className={styles["home-page__lists-grid"]}>
          <Card
            className={cn(
              styles["home-page__list-section"],
              styles["home-page__list-section--pending"],
            )}
          >
            <h2 className={styles["home-page__list-title"]}>Pendientes</h2>
            <TreeList nodes={pendingTree} mode="pending" />
          </Card>
        </div>
      </main>

      {showResetModal ? (
        <Dialog open>
          <DialogContent className={styles["home-page__modal-card"]}>
            <DialogHeader>
              <DialogTitle className={styles["home-page__modal-title"]}>Desmarcar completados</DialogTitle>
              <DialogDescription className={styles["home-page__modal-text"]}>
                Vas a desmarcar todos los ítems completados. ¿Querés continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={styles["home-page__modal-actions"]}>
              <Link
                href="/"
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={resetCompletedAction}>
                <Button
                  type="submit"
                  className={styles["home-page__modal-button"]}
                >
                  Confirmar y desmarcar
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {showUncheckModal && nodeForUncheckConfirmation ? (
        <Dialog open>
          <DialogContent className={styles["home-page__modal-card"]}>
            <DialogHeader>
              <DialogTitle className={styles["home-page__modal-title"]}>Desmarcar ítem padre</DialogTitle>
              <DialogDescription className={styles["home-page__modal-text"]}>
                Vas a desmarcar <strong>{nodeForUncheckConfirmation.title}</strong> y todos sus
                descendientes. ¿Querés continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={styles["home-page__modal-actions"]}>
              <Link
                href="/"
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={confirmUncheckParentAction}>
                <input type="hidden" name="id" value={nodeForUncheckConfirmation.id} />
                <Button
                  type="submit"
                  className={styles["home-page__modal-button"]}
                >
                  Confirmar y desmarcar
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {confirmId && nodeForConfirmation ? (
        <Dialog open>
          <DialogContent className={styles["home-page__modal-card"]}>
            <DialogHeader>
              <DialogTitle className={styles["home-page__modal-title"]}>Completar ítem padre</DialogTitle>
              <DialogDescription className={styles["home-page__modal-text"]}>
                Vas a completar <strong>{nodeForConfirmation.title}</strong> y todos sus descendientes.
                ¿Querés continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={styles["home-page__modal-actions"]}>
              <Link
                href="/"
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={confirmParentAction}>
                <input type="hidden" name="id" value={nodeForConfirmation.id} />
                <Button
                  type="submit"
                  className={cn(
                    styles["home-page__modal-button"],
                    styles["home-page__modal-button--confirm"],
                  )}
                >
                  Confirmar y completar todo
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
