import type { ReactNode } from "react";
import { headers } from "next/headers";
import TreeList from "@/app/features/lists/components/TreeList/TreeList";
import Link from "@/app/features/lists/components/Link/Link";
import AddRootItemButton from "@/app/features/lists/components/AddRootItemButton/AddRootItemButton";
import CompletedItemsDialog from "@/app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog";
import ListTitleEditable from "@/app/features/lists/components/ListTitleEditable/ListTitleEditable";
import ResetCompletedDialog from "@/app/features/lists/components/ResetCompletedDialog/ResetCompletedDialog";
import type { ApiError, List, ListsResponse } from "@/app/features/lists/types";
import { buildVisibleTree, countByStatus, findNode } from "@/app/features/lists/tree";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import styles from "@/app/page.module.scss";

type SearchParams = Record<string, string | string[] | undefined>;

type RouteParams = {
  listId: string;
};

type PageProps = {
  params: RouteParams | Promise<RouteParams>;
  searchParams?: SearchParams | Promise<SearchParams>;
};

type FetchResult = { activeList: List } | { error: string; details?: string };

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

  if (errorParam === "listEdit") {
    return {
      title: "No pudimos editar el nombre de la lista.",
      description: "Reintentá la edición o recargá la página para sincronizar los datos.",
    };
  }

  if (errorParam === "listDelete") {
    return {
      title: "No pudimos eliminar la lista.",
      description: "Reintentá la eliminación o recargá la página para sincronizar los datos.",
    };
  }

  return {
    title: "Ocurrió un error inesperado.",
    description: "Volvé a intentarlo en unos segundos.",
  };
}

async function fetchListById(listId: string): Promise<FetchResult> {
  const baseUrl = await getBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/lists?listId=${encodeURIComponent(listId)}`, {
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

    return { activeList: (data as ListsResponse).activeList };
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

function ErrorState({ title, description, listPath }: { title: string; description: string; listPath: string }) {
  return (
    <div className={cn(styles["home-page__inline-state"], styles["home-page__inline-state--error"])}>
      <h2 className={styles["home-page__inline-state-title"]}>{title}</h2>
      <p className={styles["home-page__inline-state-description"]}>{description}</p>
      <Link
        href={listPath}
        className={styles["home-page__inline-state-link"]}
      >
        Reintentar
      </Link>
    </div>
  );
}

export default async function ListPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const listId = resolvedParams.listId;
  const listPath = `/lists/${encodeURIComponent(listId)}`;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const result = await fetchListById(listId);
  const errorParam = getSingleParam(resolvedSearchParams, "error");
  const actionError = resolveActionError(errorParam);

  if ("error" in result) {
    return (
      <PageShell>
        <ErrorState
          title={result.error}
          description={result.details ?? "Intentá nuevamente."}
          listPath={listPath}
        />
      </PageShell>
    );
  }

  const activeList = result.activeList;
  const items = activeList.items;
  const confirmId = getSingleParam(resolvedSearchParams, "confirm");
  const nodeForConfirmation = confirmId ? findNode(items, confirmId) : undefined;
  const confirmationMissing = Boolean(confirmId && !nodeForConfirmation);
  const confirmUncheckId = getSingleParam(resolvedSearchParams, "confirmUncheck");
  const nodeForUncheckConfirmation = confirmUncheckId ? findNode(items, confirmUncheckId) : undefined;
  const uncheckConfirmationMissing = Boolean(confirmUncheckId && !nodeForUncheckConfirmation);
  const confirmReset = getSingleParam(resolvedSearchParams, "confirmReset");
  const openCompleted = getSingleParam(resolvedSearchParams, "openCompleted");
  const shouldConfirmReset = confirmReset === "true";

  if (items.length === 0) {
    return (
      <PageShell>
        <header className={styles["home-page__header"]}>
          <div className={styles["home-page__title-row"]}>
            <SidebarTrigger className={styles["home-page__sidebar-trigger"]} />
            <ListTitleEditable listId={listId} title={activeList.title} className={styles["home-page__title"]} />
          </div>
          <p className={styles["home-page__subtitle"]}>
            Sistema jerárquico con completado automático de padres y confirmación solo en completado
            manual.
          </p>
        </header>
        {actionError ? (
          <div className={cn(styles["home-page__banner"], styles["home-page__banner--error"])}>
            <h2 className={styles["home-page__banner-title"]}>{actionError.title}</h2>
            <p className={styles["home-page__banner-description"]}>{actionError.description}</p>
          </div>
        ) : null}
        <div className={styles["home-page__lists-grid"]}>
          <Card
            className={cn(
              styles["home-page__list-section"],
              styles["home-page__list-section--pending"],
            )}
          >
            <div className={styles["home-page__list-header"]}>
              <h2 className={styles["home-page__list-title"]}>Pendientes</h2>
              <AddRootItemButton listId={listId} />
            </div>
            <TreeList nodes={[]} mode="pending" listId={listId} />
          </Card>
        </div>
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
  const shouldOpenCompletedDialog = openCompleted === "true" && !showResetModal && !showUncheckModal;

  return (
    <div className={styles["home-page"]}>
      <main className={styles["home-page__main"]}>
        <header className={styles["home-page__header"]}>
          <div className={styles["home-page__title-row"]}>
            <SidebarTrigger className={styles["home-page__sidebar-trigger"]} />
            <ListTitleEditable listId={listId} title={activeList.title} className={styles["home-page__title"]} />
          </div>
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
            <CompletedItemsDialog
              nodes={completedTree}
              completedCount={completedCount}
              canResetCompleted={canResetCompleted}
              listId={listId}
              openOnLoad={shouldOpenCompletedDialog}
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
            <div className={styles["home-page__list-header"]}>
              <h2 className={styles["home-page__list-title"]}>Pendientes</h2>
              <AddRootItemButton listId={listId} />
            </div>
            <TreeList nodes={pendingTree} mode="pending" listId={listId} />
          </Card>
        </div>
      </main>

      {showResetModal ? (
        <ResetCompletedDialog open={showResetModal} dismissHref={listPath}>
          <DialogContent className={styles["home-page__modal-card"]}>
            <DialogHeader>
              <DialogTitle className={styles["home-page__modal-title"]}>Desmarcar completados</DialogTitle>
              <DialogDescription className={styles["home-page__modal-text"]}>
                Vas a desmarcar todos los ítems completados. ¿Querés continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={styles["home-page__modal-actions"]}>
              <Link
                href={listPath}
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={resetCompletedAction}>
                <input type="hidden" name="listId" value={listId} />
                <Button
                  type="submit"
                  className={styles["home-page__modal-button"]}
                >
                  Confirmar y desmarcar
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </ResetCompletedDialog>
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
                href={listPath}
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={confirmUncheckParentAction}>
                <input type="hidden" name="listId" value={listId} />
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
                href={listPath}
                className={styles["home-page__modal-link"]}
              >
                Cancelar
              </Link>
              <form action={confirmParentAction}>
                <input type="hidden" name="listId" value={listId} />
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
