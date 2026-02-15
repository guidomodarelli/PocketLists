import { render, screen } from "@testing-library/react";
import type { GetServerSidePropsContext } from "next";
import type { ReactNode } from "react";
import ListPage, { getServerSideProps } from "@/pages/lists/[listId]";
import * as services from "@/app/features/lists/services";
import type { List, ListSummary } from "@/app/features/lists/types";

jest.mock("@/app/features/lists/services", () => ({
  getListById: jest.fn(),
  getListSummaries: jest.fn(),
}));

jest.mock("@/app/features/lists/actions", () => ({
  confirmParentAction: jest.fn(),
  confirmUncheckParentAction: jest.fn(),
  resetCompletedAction: jest.fn(),
}));

jest.mock("@/app/features/lists/components/ListsSidebar/ListsSidebar", () => ({
  __esModule: true,
  default: ({ lists }: { lists: ListSummary[] }) => (
    <aside data-testid="lists-sidebar">{lists.map((list) => list.title).join(",")}</aside>
  ),
}));

jest.mock("@/app/features/lists/components/TreeList/TreeList", () => ({
  __esModule: true,
  default: ({ mode, nodes, listId }: { mode: string; nodes: Array<{ id: string }>; listId: string }) => (
    <div data-testid={`tree-list-${mode}`}>
      nodes:{nodes.length} list:{listId}
    </div>
  ),
}));

jest.mock("@/app/features/lists/components/Link/Link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/app/features/lists/components/AddRootItemButton/AddRootItemButton", () => ({
  __esModule: true,
  default: ({ listId }: { listId: string }) => (
    <div data-testid="add-root-item-button">AddRootItemButton:{listId}</div>
  ),
}));

jest.mock("@/app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog", () => ({
  __esModule: true,
  default: ({
    completedCount,
    listId,
    openOnLoad,
  }: {
    completedCount: number;
    listId: string;
    openOnLoad?: boolean;
  }) => (
    <div data-testid="completed-items-dialog" data-open-on-load={String(Boolean(openOnLoad))}>
      completed:{completedCount} list:{listId}
    </div>
  ),
}));

jest.mock("@/app/features/lists/components/ListTitleEditable/ListTitleEditable", () => ({
  __esModule: true,
  default: ({ title, listId }: { title: string; listId: string }) => (
    <h1 data-testid="list-title-editable">
      title:{title} list:{listId}
    </h1>
  ),
}));

jest.mock("@/app/features/lists/components/ResetCompletedDialog/ResetCompletedDialog", () => ({
  __esModule: true,
  default: ({
    open,
    dismissHref,
    children,
  }: {
    open: boolean;
    dismissHref: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="reset-completed-dialog"
      data-open={String(open)}
      data-dismiss-href={dismissHref}
    >
      {open ? children : null}
    </div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    defaultOpen,
  }: {
    children: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
  }) => {
    const isOpen = open ?? defaultOpen ?? false;

    return (
      <div
        data-testid="dialog"
        data-open-prop={open === undefined ? "undefined" : String(open)}
        data-default-open-prop={defaultOpen === undefined ? "undefined" : String(defaultOpen)}
      >
        {isOpen ? children : null}
      </div>
    );
  },
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({
    children,
    defaultOpen,
  }: {
    children: ReactNode;
    defaultOpen?: boolean;
  }) => (
    <div data-testid="sidebar-provider" data-default-open={String(defaultOpen)}>
      {children}
    </div>
  ),
  SidebarInset: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarTrigger: ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      toggle
    </button>
  ),
}));

type SearchParams = Record<string, string | string[] | undefined>;

type ListPageProps = {
  listId: string;
  lists: ListSummary[];
  defaultSidebarOpen: boolean;
  activeList?: List;
  error?: string;
  details?: string;
  searchParams?: SearchParams;
};

const servicesMock = jest.mocked(services);

function createContext({
  listId = "list-1",
  query = {},
  cookies = {},
}: {
  listId?: string;
  query?: SearchParams;
  cookies?: Record<string, string>;
}): GetServerSidePropsContext<{ listId: string }> {
  return {
    params: { listId },
    query,
    req: { cookies } as unknown as GetServerSidePropsContext["req"],
  } as GetServerSidePropsContext<{ listId: string }>;
}

function createPageProps(overrides: Partial<ListPageProps> = {}): ListPageProps {
  return {
    listId: "list-1",
    lists: [{ id: "list-1", title: "Lista 1" }],
    defaultSidebarOpen: true,
    activeList: {
      id: "list-1",
      title: "Lista 1",
      items: [],
    },
    searchParams: {},
    ...overrides,
  };
}

describe("List page (pages router)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getServerSideProps obtiene datos de la lista y estado del sidebar", async () => {
    servicesMock.getListSummaries.mockReturnValue([{ id: "list-1", title: "Lista 1" }]);
    servicesMock.getListById.mockReturnValue({
      id: "list-1",
      title: "Lista 1",
      items: [],
    });

    const result = await getServerSideProps(createContext({ cookies: { sidebar_state: "true" } }));

    expect(result).toEqual({
      props: {
        listId: "list-1",
        lists: [{ id: "list-1", title: "Lista 1" }],
        defaultSidebarOpen: true,
        activeList: {
          id: "list-1",
          title: "Lista 1",
          items: [],
        },
        searchParams: {},
      },
    });
  });

  test("getServerSideProps devuelve error y sidebar cerrado cuando corresponde", async () => {
    servicesMock.getListSummaries.mockReturnValue([{ id: "list-2", title: "Lista 2" }]);
    servicesMock.getListById.mockReturnValue(undefined);

    const result = await getServerSideProps(
      createContext({
        listId: "missing",
        cookies: { sidebar_state: "false" },
      })
    );

    expect(result).toEqual({
      props: {
        listId: "missing",
        lists: [{ id: "list-2", title: "Lista 2" }],
        defaultSidebarOpen: false,
        error: "No encontramos la lista solicitada.",
        details: "Seleccioná otra lista desde la barra lateral.",
        searchParams: {},
      },
    });
  });

  test("renderiza estado de error cuando no hay lista activa", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: undefined,
          error: "Error API",
          details: "Detalle API",
        })}
      />
    );

    expect(screen.getByText("Error API")).toBeInTheDocument();
    expect(screen.getByText("Detalle API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/lists/list-1");
  });

  test("renderiza sidebar con estado abierto/cerrado", () => {
    render(
      <ListPage
        {...createPageProps({
          lists: [{ id: "list-1", title: "Lista 1" }, { id: "list-2", title: "Lista 2" }],
          defaultSidebarOpen: false,
        })}
      />
    );

    expect(screen.getByTestId("sidebar-provider")).toHaveAttribute("data-default-open", "false");
    expect(screen.getByTestId("lists-sidebar")).toHaveTextContent("Lista 1,Lista 2");
    expect(screen.getByTestId("sidebar-inset")).toBeInTheDocument();
  });

  test("renderiza estado vacío cuando no hay ítems", () => {
    render(<ListPage {...createPageProps()} />);

    expect(screen.getByTestId("tree-list-pending")).toHaveTextContent("nodes:0");
    expect(screen.getByTestId("tree-list-pending")).toHaveTextContent("list:list-1");
    expect(screen.getByTestId("add-root-item-button")).toBeInTheDocument();
  });

  test("renderiza vista principal con pendientes y acceso a completados", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [
              { id: "pending-1", title: "Pendiente", completed: false, children: [] },
              { id: "completed-1", title: "Completado", completed: true, children: [] },
            ],
          },
        })}
      />
    );

    expect(screen.getByText("Pendientes: 1")).toBeInTheDocument();
    expect(screen.getByText("Completados: 1")).toBeInTheDocument();
    expect(screen.getByTestId("list-title-editable")).toHaveTextContent("title:Lista 1");
    expect(screen.getByTestId("tree-list-pending")).toBeInTheDocument();
    expect(screen.getByTestId("completed-items-dialog")).toHaveTextContent("completed:1");
    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open-on-load", "false");
  });

  test("propaga al modal de completados el flag de reapertura por query", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
          },
          searchParams: { openCompleted: "true" },
        })}
      />
    );

    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open-on-load", "true");
  });

  test("muestra modal de confirmación reset cuando corresponde", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
          },
          searchParams: { confirmReset: "true" },
        })}
      />
    );

    expect(screen.getByRole("heading", { name: "Desmarcar completados" })).toBeInTheDocument();
    expect(screen.getByText("Vas a desmarcar todos los ítems completados. ¿Querés continuar?")).toBeInTheDocument();
    expect(screen.getByTestId("reset-completed-dialog")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("reset-completed-dialog")).toHaveAttribute("data-dismiss-href", "/lists/list-1");
  });

  test("muestra banner cuando confirm apunta a un ítem inexistente", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "root", title: "Root", completed: false, children: [] }],
          },
          searchParams: { confirm: "missing-id" },
        })}
      />
    );

    expect(screen.getByText("No encontramos el ítem que querías confirmar. Probá actualizar la página.")).toBeInTheDocument();
  });
});
