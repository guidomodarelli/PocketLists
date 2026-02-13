"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createListAction, editListTitleAction } from "../../actions";
import type { ListSummary } from "../../types";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import styles from "./ListsSidebar.module.scss";

type ListsSidebarProps = {
  lists: ListSummary[];
};

const DOUBLE_CLICK_DELAY_MS = 250;

export default function ListsSidebar({ lists }: ListsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editingListId, setEditingListId] = useState<string | null>(null);
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={styles["lists-sidebar__header"]}>
        <h2 className={styles["lists-sidebar__title"]}>PocketLists</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Listas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists.map((list) => {
                const href = `/lists/${encodeURIComponent(list.id)}`;
                const isActive = pathname === href;
                const isEditing = editingListId === list.id;
                const normalizedListTitle = list.title.trim();
                const isPlaceholder = normalizedListTitle.length === 0;
                const visibleListTitle = isPlaceholder ? "(Sin nombre)" : list.title;

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
                              if (nextTitle === normalizedListTitle) {
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
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <form action={createListAction} className={styles["lists-sidebar__new-list-form"]}>
          <Button type="submit" className={styles["lists-sidebar__new-list-button"]}>
            <Plus className={styles["lists-sidebar__new-list-icon"]} />
            <span>Nueva lista</span>
          </Button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
