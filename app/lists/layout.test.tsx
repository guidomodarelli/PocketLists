import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import ListsLayout from "./layout";
import * as services from "@/app/features/lists/services";

jest.mock("@/app/features/lists/services", () => ({
  getListSummaries: jest.fn(),
}));

jest.mock("@/app/features/lists/components/ListsSidebar/ListsSidebar", () => ({
  __esModule: true,
  default: ({ lists }: { lists: Array<{ id: string; title: string }> }) => (
    <aside data-testid="lists-sidebar">{lists.map((list) => list.title).join(",")}</aside>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-inset">{children}</div>,
}));

const servicesMock = jest.mocked(services);

describe("Lists layout", () => {
  test("renderiza sidebar con listas y contenido principal", () => {
    servicesMock.getListSummaries.mockReturnValue([
      { id: "list-1", title: "Lista 1" },
      { id: "list-2", title: "Lista 2" },
    ]);

    render(
      <ListsLayout>
        <div>contenido</div>
      </ListsLayout>
    );

    expect(screen.getByTestId("lists-sidebar")).toHaveTextContent("Lista 1,Lista 2");
    expect(screen.getByTestId("sidebar-inset")).toHaveTextContent("contenido");
  });
});
