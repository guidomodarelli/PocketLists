import type { GetServerSideProps } from "next";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import Loading from "@/app/loading";
import TreeList from "@/app/features/lists/components/TreeList/TreeList";
import Link from "@/app/features/lists/components/Link/Link";
import AddRootItemButton from "@/app/features/lists/components/AddRootItemButton/AddRootItemButton";
import CompletedItemsDialog from "@/app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog";
import ListTitleEditable from "@/app/features/lists/components/ListTitleEditable/ListTitleEditable";
import ListsSidebar from "@/app/features/lists/components/ListsSidebar/ListsSidebar";
import ResetCompletedDialog from "@/app/features/lists/components/ResetCompletedDialog/ResetCompletedDialog";
import type { List, ListSummary } from "@/app/features/lists/types";
import { buildVisibleTree, countByStatus, findNode } from "@/app/features/lists/tree";
import { useActiveListQuery } from "@/app/features/lists/hooks/useListsQuery";
import { useListsMutations } from "@/app/features/lists/hooks/useListsMutations";
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
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import styles from "@/app/page.module.scss";

type SearchParams = Record<string, string | string[] | undefined>;

type RouteParams = {
  listId: string;
};

type ListPageProps = {
  listId: string;
  lists: ListSummary[];
  defaultSidebarOpen: boolean;
  activeList?: List;
  error?: string;
  details?: string;
  searchParams?: SearchParams;
};

export const getServerSideProps = (async ({ params, query, req }) => {
  const { getListById, getListSummaries } = await import("@/app/features/lists/services");
  const rawListId = params?.listId;
  const listId = Array.isArray(rawListId) ? rawListId[0] : rawListId;

  if (!listId || listId.trim().length === 0) {
    return {
      notFound: true,
    };
  }

  let normalizedListId = listId;
  try {
    normalizedListId = decodeURIComponent(listId);
  } catch {
    normalizedListId = listId;
  }

  const lists = await getListSummaries();
  const defaultSidebarOpen = req.cookies?.sidebar_state !== "false";
  const activeList = await getListById(normalizedListId);

  if (!activeList) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      listId: normalizedListId,
      lists,
      defaultSidebarOpen,
      activeList,
      searchParams: query,
    },
  };
}) satisfies GetServerSideProps<ListPageProps, RouteParams>;

function getSingleParam(searchParams: SearchParams | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getRouteListId(listIdParam: string | string[] | undefined): string | null {
  const rawListId = Array.isArray(listIdParam) ? listIdParam[0] : listIdParam;
  if (!rawListId || rawListId.trim().length === 0) {
    return null;
  }

  try {
    return decodeURIComponent(rawListId);
  } catch {
    return rawListId;
  }
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

function normalizeRedirectHref(redirectTo: string): string {
  const redirectUrl = new URL(redirectTo, "http://localhost");
  return `${redirectUrl.pathname}${redirectUrl.search}`;
}

function isDifferentLocation(redirectTo: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const redirectUrl = new URL(redirectTo, window.location.origin);
  return redirectUrl.pathname !== window.location.pathname || redirectUrl.search !== window.location.search;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  if (
    target.closest(
      "input, textarea, select, button, a, [contenteditable=''], [contenteditable='true'], [contenteditable=true]"
    )
  ) {
    return true;
  }

  if (
    target.closest(
      "[role='button'], [role='menuitem'], [role='checkbox'], [role='switch'], [role='radio'], [role='tab'], [role='link'], [role='option'], [role='textbox'], [role='combobox']"
    )
  ) {
    return true;
  }

  return false;
}

function ListsPageLayout({
  children,
  lists,
  defaultSidebarOpen,
  onCreateList,
  onEditListTitle,
  onDeleteList,
}: {
  children: ReactNode;
  lists: ListSummary[];
  defaultSidebarOpen: boolean;
  onCreateList: () => Promise<unknown> | unknown;
  onEditListTitle: (listId: string, title: string) => Promise<unknown> | unknown;
  onDeleteList: (listId: string, currentListId: string) => Promise<unknown> | unknown;
}) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <ListsSidebar
        lists={lists}
        onCreateList={onCreateList}
        onEditListTitle={onEditListTitle}
        onDeleteList={onDeleteList}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
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

export default function ListPage({
  listId,
  lists,
  defaultSidebarOpen,
  activeList,
  error,
  details,
  searchParams,
}: ListPageProps) {
  const router = useRouter();
  const runtimeListId = getRouteListId(router.query.listId) ?? listId;
  const runtimeSearchParams: SearchParams = router.isReady
    ? (router.query as SearchParams)
    : (searchParams ?? {});
  const listPath = `/lists/${encodeURIComponent(runtimeListId)}`;
  const [sidebarLists, setSidebarLists] = useState<ListSummary[]>(lists);
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);
  const [isResetCompletedModalOpen, setIsResetCompletedModalOpen] = useState(false);
  const errorParam = getSingleParam(runtimeSearchParams, "error");
  const actionError = resolveActionError(errorParam);
  const routeMatchesInitialProps = runtimeListId === listId;
  const { data: queryData, error: queryError } = useActiveListQuery(runtimeListId, {
    initialActiveList: routeMatchesInitialProps ? activeList : undefined,
    listsFallback: sidebarLists,
  });

  useEffect(() => {
    setSidebarLists(lists);
  }, [lists]);

  useEffect(() => {
    if (queryData?.lists) {
      setSidebarLists(queryData.lists);
    }
  }, [queryData?.lists]);

  useEffect(() => {
    const handleGlobalEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented || event.repeat || event.isComposing) {
        return;
      }

      const keyboardTarget = event.target instanceof Element ? event.target : document.activeElement;
      if (isInteractiveTarget(keyboardTarget)) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent("lists:add-root-draft", {
          detail: { listId: runtimeListId },
        })
      );
    };

    window.addEventListener("keydown", handleGlobalEnter);

    return () => {
      window.removeEventListener("keydown", handleGlobalEnter);
    };
  }, [runtimeListId]);

  const resolvedLists = queryData?.lists ?? sidebarLists;
  const resolvedActiveList = queryData?.activeList ?? (routeMatchesInitialProps ? activeList : undefined);
  const { mutateAction } = useListsMutations(runtimeListId, {
    onRedirect: (redirectTo, targetListId) => {
      if (targetListId !== runtimeListId || isDifferentLocation(redirectTo)) {
        void router.push(normalizeRedirectHref(redirectTo));
      }
    },
  });

  const handleCreateList = () => mutateAction("createList", {});
  const handleEditListTitle = (targetListId: string, title: string) =>
    mutateAction("editListTitle", {
      listId: targetListId,
      title,
    });
  const handleDeleteList = (targetListId: string, currentListId: string) =>
    mutateAction("deleteList", {
      listId: targetListId,
      currentListId,
    });
  const handleToggleItem = (targetListId: string, id: string, nextCompleted: boolean) =>
    mutateAction("toggleItem", {
      listId: targetListId,
      id,
      nextCompleted,
    });
  const handleConfirmParent = (targetListId: string, id: string) =>
    mutateAction("confirmParent", {
      listId: targetListId,
      id,
    });
  const handleConfirmUncheckParent = (targetListId: string, id: string) =>
    mutateAction("confirmUncheckParent", {
      listId: targetListId,
      id,
    });
  const handleCreateItem = (targetListId: string, title: string, parentId?: string) =>
    mutateAction("createItem", {
      listId: targetListId,
      title,
      parentId,
    });
  const handleDeleteItem = (targetListId: string, id: string) =>
    mutateAction("deleteItem", {
      listId: targetListId,
      id,
    });
  const handleEditItemTitle = (targetListId: string, id: string, title: string) =>
    mutateAction("editItemTitle", {
      listId: targetListId,
      id,
      title,
    });
  const handleResetCompleted = (targetListId: string) =>
    mutateAction("resetCompleted", {
      listId: targetListId,
    });

  if (routeMatchesInitialProps && error) {
    return (
      <ListsPageLayout
        lists={resolvedLists}
        defaultSidebarOpen={defaultSidebarOpen}
        onCreateList={handleCreateList}
        onEditListTitle={handleEditListTitle}
        onDeleteList={handleDeleteList}
      >
        <PageShell>
          <ErrorState
            title={error ?? "No se pudieron obtener las listas."}
            description={details ?? "Intentá recargar la página."}
            listPath={listPath}
          />
        </PageShell>
      </ListsPageLayout>
    );
  }

  if (!resolvedActiveList) {
    if (!queryError) {
      return (
        <ListsPageLayout
          lists={resolvedLists}
          defaultSidebarOpen={defaultSidebarOpen}
          onCreateList={handleCreateList}
          onEditListTitle={handleEditListTitle}
          onDeleteList={handleDeleteList}
        >
          <Loading />
        </ListsPageLayout>
      );
    }

    return (
      <ListsPageLayout
        lists={resolvedLists}
        defaultSidebarOpen={defaultSidebarOpen}
        onCreateList={handleCreateList}
        onEditListTitle={handleEditListTitle}
        onDeleteList={handleDeleteList}
      >
        <PageShell>
          <ErrorState
            title="No se pudieron obtener las listas."
            description={queryError.message}
            listPath={listPath}
          />
        </PageShell>
      </ListsPageLayout>
    );
  }

  const items = resolvedActiveList.items;
  const confirmId = getSingleParam(runtimeSearchParams, "confirm");
  const nodeForConfirmation = confirmId ? findNode(items, confirmId) : undefined;
  const confirmationMissing = Boolean(confirmId && !nodeForConfirmation);
  const confirmUncheckId = getSingleParam(runtimeSearchParams, "confirmUncheck");
  const nodeForUncheckConfirmation = confirmUncheckId ? findNode(items, confirmUncheckId) : undefined;
  const uncheckConfirmationMissing = Boolean(confirmUncheckId && !nodeForUncheckConfirmation);
  const shouldConfirmReset = isResetCompletedModalOpen;
  const hasItems = items.length > 0;

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
    <ListsPageLayout
      lists={resolvedLists}
      defaultSidebarOpen={defaultSidebarOpen}
      onCreateList={handleCreateList}
      onEditListTitle={handleEditListTitle}
      onDeleteList={handleDeleteList}
    >
      <div className={styles["home-page"]}>
        <main className={styles["home-page__main"]}>
          <header className={styles["home-page__header"]}>
            <div className={styles["home-page__title-row"]}>
              <SidebarTrigger className={styles["home-page__sidebar-trigger"]} />
              <ListTitleEditable
                listId={runtimeListId}
                title={resolvedActiveList.title}
                className={styles["home-page__title"]}
                onEditTitle={handleEditListTitle}
              />
            </div>
            <p className={styles["home-page__subtitle"]}>
              Sistema jerárquico con completado automático de padres y confirmación solo en completado
              manual.
            </p>
            {hasItems ? (
              <>
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
                    listId={runtimeListId}
                    open={isCompletedDialogOpen}
                    onOpenChange={setIsCompletedDialogOpen}
                    onRequestResetCompleted={() => setIsResetCompletedModalOpen(true)}
                    onToggleItem={handleToggleItem}
                    onConfirmParent={handleConfirmParent}
                    onConfirmUncheckParent={handleConfirmUncheckParent}
                    onCreateItem={handleCreateItem}
                    onDeleteItem={handleDeleteItem}
                    onEditItemTitle={handleEditItemTitle}
                  />
                </div>
              </>
            ) : null}
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
                <AddRootItemButton listId={runtimeListId} />
              </div>
              <TreeList
                nodes={pendingTree}
                mode="pending"
                listId={runtimeListId}
                onToggleItem={handleToggleItem}
                onConfirmParent={handleConfirmParent}
                onConfirmUncheckParent={handleConfirmUncheckParent}
                onCreateItem={handleCreateItem}
                onDeleteItem={handleDeleteItem}
                onEditItemTitle={handleEditItemTitle}
              />
            </Card>
          </div>
        </main>

        {showResetModal ? (
          <ResetCompletedDialog
            open={showResetModal}
            onOpenChange={(nextOpen) => setIsResetCompletedModalOpen(nextOpen)}
          >
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
                  onClick={(event) => {
                    event.preventDefault();
                    setIsResetCompletedModalOpen(false);
                  }}
                >
                  Cancelar
                </Link>
                <Button
                  type="button"
                  className={styles["home-page__modal-button"]}
                  onClick={() => {
                    setIsResetCompletedModalOpen(false);
                    setIsCompletedDialogOpen(false);
                    void handleResetCompleted(runtimeListId);
                  }}
                >
                  Confirmar y desmarcar
                </Button>
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
                <Button
                  type="button"
                  className={styles["home-page__modal-button"]}
                  onClick={() => {
                    void handleConfirmUncheckParent(runtimeListId, nodeForUncheckConfirmation.id);
                  }}
                >
                  Confirmar y desmarcar
                </Button>
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
                <Button
                  type="button"
                  className={cn(
                    styles["home-page__modal-button"],
                    styles["home-page__modal-button--confirm"],
                  )}
                  onClick={() => {
                    void handleConfirmParent(runtimeListId, nodeForConfirmation.id);
                  }}
                >
                  Confirmar y completar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </ListsPageLayout>
  );
}
