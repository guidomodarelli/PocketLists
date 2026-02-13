import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import ListsSidebar from "./ListsSidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/lists/list-2"),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock("../../actions", () => ({
  createListAction: jest.fn(),
}));

jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <li>{children}</li>,
  SidebarMenuButton: ({
    children,
    isActive,
  }: {
    children: ReactNode;
    isActive?: boolean;
  }) => <button data-active={String(Boolean(isActive))}>{children}</button>,
  SidebarRail: () => <div data-testid="sidebar-rail" />,
}));

describe("ListsSidebar", () => {
  test("renderiza navegación de listas y botón para crear nueva lista", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Lista 1" })).toHaveAttribute("href", "/lists/list-1");
    expect(screen.getByRole("link", { name: "Lista 2" })).toHaveAttribute("href", "/lists/list-2");
    expect(screen.getByRole("button", { name: "Nueva lista" })).toBeInTheDocument();
  });

  test("marca como activa la lista de la ruta actual", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    const list1Trigger = screen.getByRole("button", { name: "Lista 1" });
    const list2Trigger = screen.getByRole("button", { name: "Lista 2" });

    expect(list1Trigger).toHaveAttribute("data-active", "false");
    expect(list2Trigger).toHaveAttribute("data-active", "true");
  });
});
