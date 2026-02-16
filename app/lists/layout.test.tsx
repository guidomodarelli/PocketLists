import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import ListsLayout from "./layout";
import * as services from "@/app/features/lists/services";

jest.mock("@/app/features/lists/services", () => ({
  getListSummaries: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/app/features/lists/components/ListsSidebar/ListsSidebar", () => ({
  __esModule: true,
  default: ({ lists }: { lists: Array<{ id: string; title: string }> }) => (
    <aside data-testid="lists-sidebar">{lists.map((list) => list.title).join(",")}</aside>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children, defaultOpen }: { children: ReactNode; defaultOpen?: boolean }) => (
    <div data-testid="sidebar-provider" data-default-open={String(defaultOpen)}>
      {children}
    </div>
  ),
  SidebarInset: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-inset">{children}</div>,
}));

const servicesMock = jest.mocked(services);
const cookiesMock = cookies as jest.MockedFunction<typeof cookies>;

function mockSidebarStateCookie(value?: string) {
  cookiesMock.mockResolvedValue({
    get: (key: string) => {
      if (key !== "sidebar_state" || value === undefined) {
        return undefined;
      }

      return { value } as { value: string };
    },
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

describe("Lists layout", () => {
  beforeEach(() => {
    mockSidebarStateCookie();
  });

  test("renderiza sidebar con listas y contenido principal", async () => {
    servicesMock.getListSummaries.mockResolvedValue([
      { id: "list-1", title: "Lista 1" },
      { id: "list-2", title: "Lista 2" },
    ]);

    const view = await ListsLayout({
      children: <div>contenido</div>,
    });
    render(view);

    expect(screen.getByTestId("lists-sidebar")).toHaveTextContent("Lista 1,Lista 2");
    expect(screen.getByTestId("sidebar-inset")).toHaveTextContent("contenido");
    expect(screen.getByTestId("sidebar-provider")).toHaveAttribute("data-default-open", "true");
  });

  test("usa sidebar cerrada por defecto cuando la cookie de estado está en false", async () => {
    servicesMock.getListSummaries.mockResolvedValue([{ id: "list-1", title: "Lista 1" }]);
    mockSidebarStateCookie("false");

    const view = await ListsLayout({
      children: <div>contenido</div>,
    });
    render(view);

    expect(screen.getByTestId("sidebar-provider")).toHaveAttribute("data-default-open", "false");
  });
});
