import type { ReactNode } from "react";
import { cookies } from "next/headers";
import ListsSidebar from "@/app/features/lists/components/ListsSidebar/ListsSidebar";
import { getListSummaries } from "@/app/features/lists/services";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

type ListsLayoutProps = {
  children: ReactNode;
};

export default async function ListsLayout({ children }: ListsLayoutProps) {
  const cookiesStore = await cookies();
  const defaultSidebarOpen = cookiesStore.get("sidebar_state")?.value !== "false";
  const lists = getListSummaries();

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <ListsSidebar lists={lists} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
