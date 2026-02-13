"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { createListAction } from "../../actions";
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
import styles from "./ListsSidebar.module.scss";

type ListsSidebarProps = {
  lists: ListSummary[];
};

export default function ListsSidebar({ lists }: ListsSidebarProps) {
  const pathname = usePathname();

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

                return (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={list.title}>
                      <NextLink href={href}>
                        <span className={styles["lists-sidebar__item-title"]}>{list.title}</span>
                      </NextLink>
                    </SidebarMenuButton>
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
