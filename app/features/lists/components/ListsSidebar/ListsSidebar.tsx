"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { createListAction, deleteListAction, editListTitleAction } from "../../actions";
import type { ListSummary } from "../../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import styles from "./ListsSidebar.module.scss";

type ListsSidebarProps = {
  lists: ListSummary[];
};

const DOUBLE_CLICK_DELAY_MS = 250;

function getVisibleListTitle(title: string): string {
  const normalizedListTitle = title.trim();
  return normalizedListTitle.length === 0 ? "(Sin nombre)" : title;
}

function getCurrentListId(pathname: string): string | null {
  const pathSegments = pathname.split("/");
  if (pathSegments[1] !== "lists" || !pathSegments[2]) {
    return null;
  }

  return decodeURIComponent(pathSegments[2]);
}

export default function ListsSidebar({ lists }: ListsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentListId = getCurrentListId(pathname);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listPendingDeletion, setListPendingDeletion] = useState<ListSummary | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const editFormRef = useRef<HTMLFormElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const isEscCancelRef = useRef(false);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingNavigation = () => {
    if (!navigateTimeoutRef.current) {
      return;
    }

    clearTimeout(navigateTimeoutRef.current);
    navigateTimeoutRef.current = null;
  };

  useEffect(() => {
    if (!editingListId) {
      return;
    }

    const input = editInputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [editingListId]);

  useEffect(() => {
    return () => {
      if (!navigateTimeoutRef.current) {
        return;
      }

      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
    };
  }, []);

  const openEditMode = (list: ListSummary) => {
    clearPendingNavigation();
    isEscCancelRef.current = false;
    setEditingListId(list.id);
    setDraftTitle(list.title);
  };

  const requestDeleteConfirmation = (list: ListSummary) => {
    clearPendingNavigation();
    setListPendingDeletion(list);
  };

  const closeDeleteConfirmation = () => {
    setListPendingDeletion(null);
  };

  const confirmDeleteList = () => {
    if (!listPendingDeletion) {
      return;
    }

    const deleteFormId = `delete-list-${listPendingDeletion.id}`;
    const form = document.getElementById(deleteFormId) as HTMLFormElement | null;
    form?.requestSubmit();
    closeDeleteConfirmation();
  };

  const pendingDeleteListTitle = listPendingDeletion ? getVisibleListTitle(listPendingDeletion.title) : "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={styles["lists-sidebar__header"]}>
        <div className={styles["lists-sidebar__header-row"]}>
          <h2 className={styles["lists-sidebar__title"]} aria-label="PocketLists">
            <span className={styles["lists-sidebar__title-full"]} aria-hidden="true">
              PocketLists
            </span>
            <span className={styles["lists-sidebar__title-short"]} aria-hidden="true">
              PL
            </span>
          </h2>
          <SidebarTrigger
            className={styles["lists-sidebar__desktop-trigger"]}
            aria-label="Colapsar o expandir sidebar"
            title="Colapsar o expandir sidebar"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <div className={styles["lists-sidebar__group-header"]}>
              <span className={styles["lists-sidebar__group-title"]}>Listas</span>
              <form action={createListAction} className={styles["lists-sidebar__new-list-form"]}>
                <Button type="submit" variant="ghost" size="xs" className={styles["lists-sidebar__new-list-button"]}>
                  <Plus className={styles["lists-sidebar__new-list-icon"]} />
                  <span className={styles["lists-sidebar__new-list-text"]}>Nueva lista</span>
                </Button>
              </form>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists.map((list) => {
                const href = `/lists/${encodeURIComponent(list.id)}`;
                const isActive = pathname === href;
                const isEditing = editingListId === list.id;
                const visibleListTitle = getVisibleListTitle(list.title);
                const isPlaceholder = list.title.trim().length === 0;
                const deleteFormId = `delete-list-${list.id}`;

                return (
                  <SidebarMenuItem key={list.id}>
                    {isEditing ? (
                      <SidebarMenuButton isActive={isActive} className={styles["lists-sidebar__item-button"]}>
                        <form
                          ref={editFormRef}
                          action={editListTitleAction}
                          className={styles["lists-sidebar__edit-form"]}
                        >
                          <input type="hidden" name="listId" value={list.id} />
                          <input
                            ref={editInputRef}
                            name="title"
                            value={draftTitle}
                            onChange={(event) => setDraftTitle(event.target.value)}
                            className={styles["lists-sidebar__item-title-input"]}
                            aria-label={`Editar nombre de ${visibleListTitle}`}
                            onKeyDown={(event) => {
                              if (event.key !== "Escape") {
                                return;
                              }

                              event.preventDefault();
                              isEscCancelRef.current = true;
                              setDraftTitle(list.title);
                              setEditingListId(null);
                            }}
                            onBlur={() => {
                              if (isEscCancelRef.current) {
                                isEscCancelRef.current = false;
                                return;
                              }

                              const nextTitle = draftTitle.trim();
                              if (nextTitle === list.title.trim()) {
                                setDraftTitle(list.title);
                                setEditingListId(null);
                                return;
                              }

                              setEditingListId(null);
                              editFormRef.current?.requestSubmit();
                            }}
                            autoFocus
                          />
                        </form>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive} tooltip={visibleListTitle}>
                        <NextLink href={href} className={styles["lists-sidebar__item-link"]}>
                          <span
                            role="button"
                            tabIndex={0}
                            className={cn(
                              styles["lists-sidebar__item-title"],
                              isPlaceholder && styles["lists-sidebar__item-title--placeholder"]
                            )}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              clearPendingNavigation();
                              navigateTimeoutRef.current = setTimeout(() => {
                                navigateTimeoutRef.current = null;
                                router.push(href);
                              }, DOUBLE_CLICK_DELAY_MS);
                            }}
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openEditMode(list);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") {
                                return;
                              }

                              event.preventDefault();
                              event.stopPropagation();
                              clearPendingNavigation();
                              router.push(href);
                            }}
                          >
                            {visibleListTitle}
                          </span>
                        </NextLink>
                      </SidebarMenuButton>
                    )}
                    {!isEditing ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            aria-label={`Abrir acciones de ${visibleListTitle}`}
                            className={styles["lists-sidebar__actions-trigger"]}
                          >
                            <MoreVertical className={styles["lists-sidebar__actions-icon"]} />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            aria-label={`Editar ${visibleListTitle}`}
                            onSelect={() => {
                              openEditMode(list);
                            }}
                          >
                            <Pencil className={styles["lists-sidebar__menu-icon"]} />
                            Editar nombre
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            aria-label={`Eliminar ${visibleListTitle}`}
                            variant="destructive"
                            onSelect={() => {
                              requestDeleteConfirmation(list);
                            }}
                          >
                            <Trash2 className={styles["lists-sidebar__menu-icon"]} />
                            Eliminar lista
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <form id={deleteFormId} action={deleteListAction} className={styles["lists-sidebar__delete-form"]}>
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="currentListId" value={currentListId ?? list.id} />
                    </form>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AlertDialog
        open={Boolean(listPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteConfirmation();
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
            <AlertDialogDescription>{`Esta acción eliminará "${pendingDeleteListTitle}" de forma permanente.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteList}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarRail />
    </Sidebar>
  );
}
