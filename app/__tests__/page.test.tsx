import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import ListPage from "../lists/[listId]/page";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/app/features/lists/actions", () => ({
  confirmParentAction: jest.fn(),
  confirmUncheckParentAction: jest.fn(),
  resetCompletedAction: jest.fn(),
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
  default: ({ completedCount, listId }: { completedCount: number; listId: string }) => (
    <div data-testid="completed-items-dialog">
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
  SidebarTrigger: ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      toggle
    </button>
  ),
}));

const headersMock = headers as jest.MockedFunction<typeof headers>;

function mockHeaders(host = "localhost:3000", protocol = "http") {
  headersMock.mockResolvedValue({
    get: (key: string) => {
      if (key === "host") {
        return host;
      }
      if (key === "x-forwarded-proto") {
        return protocol;
      }
      return null;
    },
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

function mockFetchResponse(payload: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  } as Response);
}

describe("List page SSR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders();
  });

  test("renderiza estado de error cuando falla la API", async () => {
    mockFetchResponse({ error: "Error API", details: "Detalle API" }, false);

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: {} });
    render(view);

    expect(screen.getByText("Error API")).toBeInTheDocument();
    expect(screen.getByText("Detalle API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/lists/list-1");
  });

  test("renderiza estado vacío cuando no hay ítems", async () => {
    mockFetchResponse({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: { id: "list-1", title: "Lista 1", items: [] },
    });

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: {} });
    render(view);

    expect(screen.getByTestId("tree-list-pending")).toHaveTextContent("nodes:0");
    expect(screen.getByTestId("tree-list-pending")).toHaveTextContent("list:list-1");
    expect(screen.getByTestId("add-root-item-button")).toBeInTheDocument();
  });

  test("renderiza vista principal con pendientes y acceso a completados", async () => {
    mockFetchResponse({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: {
        id: "list-1",
        title: "Lista 1",
        items: [
        { id: "pending-1", title: "Pendiente", completed: false, children: [] },
        { id: "completed-1", title: "Completado", completed: true, children: [] },
        ],
      },
    });

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: {} });
    render(view);

    expect(screen.getByText("Pendientes: 1")).toBeInTheDocument();
    expect(screen.getByText("Completados: 1")).toBeInTheDocument();
    expect(screen.getByTestId("list-title-editable")).toHaveTextContent("title:Lista 1");
    expect(screen.getByTestId("list-title-editable")).toHaveTextContent("list:list-1");
    expect(screen.getByTestId("tree-list-pending")).toBeInTheDocument();
    expect(screen.getByTestId("completed-items-dialog")).toHaveTextContent("completed:1");
    expect(screen.getByTestId("completed-items-dialog")).toHaveTextContent("list:list-1");
  });

  test("muestra modal de confirmación reset cuando corresponde", async () => {
    mockFetchResponse({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: {
        id: "list-1",
        title: "Lista 1",
        items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
      },
    });

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: { confirmReset: "true" } });
    render(view);

    expect(screen.getByRole("heading", { name: "Desmarcar completados" })).toBeInTheDocument();
    expect(screen.getByText("Vas a desmarcar todos los ítems completados. ¿Querés continuar?")).toBeInTheDocument();
  });

  test("usa wrapper de reset controlado por query param y href de cierre", async () => {
    mockFetchResponse({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: {
        id: "list-1",
        title: "Lista 1",
        items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
      },
    });

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: { confirmReset: "true" } });
    render(view);

    const resetDialog = screen.getByTestId("reset-completed-dialog");
    expect(resetDialog).toHaveAttribute("data-open", "true");
    expect(resetDialog).toHaveAttribute("data-dismiss-href", "/lists/list-1");
  });

  test("muestra banner cuando confirm apunta a un ítem inexistente", async () => {
    mockFetchResponse({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: { id: "list-1", title: "Lista 1", items: [{ id: "root", title: "Root", completed: false, children: [] }] },
    });

    const view = await ListPage({ params: { listId: "list-1" }, searchParams: { confirm: "missing-id" } });
    render(view);

    expect(screen.getByText("No encontramos el ítem que querías confirmar. Probá actualizar la página.")).toBeInTheDocument();
  });
});
