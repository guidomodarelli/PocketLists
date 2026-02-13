import type { ReactNode } from "react";
import ListsSidebar from "@/app/features/lists/components/ListsSidebar/ListsSidebar";
import { getListSummaries } from "@/app/features/lists/services";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

type ListsLayoutProps = {
  children: ReactNode;
};

export default function ListsLayout({ children }: ListsLayoutProps) {
  const lists = getListSummaries();

  return (
    <SidebarProvider>
      <ListsSidebar lists={lists} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
