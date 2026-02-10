import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import Home from "../page";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/app/features/lists/actions", () => ({
  confirmParentAction: jest.fn(),
  confirmUncheckParentAction: jest.fn(),
  createItemAction: jest.fn(),
  resetCompletedAction: jest.fn(),
}));

jest.mock("@/app/features/lists/components/TreeList/TreeList", () => ({
  __esModule: true,
  default: ({ mode, nodes }: { mode: string; nodes: Array<{ id: string }> }) => (
    <div data-testid={`tree-list-${mode}`}>nodes:{nodes.length}</div>
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

jest.mock("@/app/features/lists/components/AddItemModal/AddItemModal", () => ({
  __esModule: true,
  default: () => <div data-testid="add-item-modal">AddItemModal</div>,
}));

jest.mock("@/app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog", () => ({
  __esModule: true,
  default: ({ completedCount }: { completedCount: number }) => (
    <div data-testid="completed-items-dialog">completed:{completedCount}</div>
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
  Dialog: ({ children, open = true }: { children: ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
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

describe("Home page SSR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders();
  });

  test("renderiza estado de error cuando falla la API", async () => {
    mockFetchResponse({ error: "Error API", details: "Detalle API" }, false);

    const view = await Home({ searchParams: {} });
    render(view);

    expect(screen.getByText("Error API")).toBeInTheDocument();
    expect(screen.getByText("Detalle API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/");
  });

  test("renderiza estado vacío cuando no hay ítems", async () => {
    mockFetchResponse({ items: [] });

    const view = await Home({ searchParams: {} });
    render(view);

    expect(screen.getByText("Todavía no hay listas para mostrar. Probá cargar datos o actualizá la página.")).toBeInTheDocument();
    expect(screen.getByTestId("add-item-modal")).toBeInTheDocument();
  });

  test("renderiza vista principal con pendientes y acceso a completados", async () => {
    mockFetchResponse({
      items: [
        { id: "pending-1", title: "Pendiente", completed: false, children: [] },
        { id: "completed-1", title: "Completado", completed: true, children: [] },
      ],
    });

    const view = await Home({ searchParams: {} });
    render(view);

    expect(screen.getByText("Pendientes: 1")).toBeInTheDocument();
    expect(screen.getByText("Completados: 1")).toBeInTheDocument();
    expect(screen.getByTestId("tree-list-pending")).toBeInTheDocument();
    expect(screen.getByTestId("completed-items-dialog")).toHaveTextContent("completed:1");
  });

  test("muestra modal de confirmación reset cuando corresponde", async () => {
    mockFetchResponse({
      items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
    });

    const view = await Home({ searchParams: { confirmReset: "true" } });
    render(view);

    expect(screen.getByRole("heading", { name: "Desmarcar completados" })).toBeInTheDocument();
    expect(screen.getByText("Vas a desmarcar todos los ítems completados. ¿Querés continuar?")).toBeInTheDocument();
  });

  test("muestra banner cuando addChild apunta a un ítem inexistente", async () => {
    mockFetchResponse({
      items: [{ id: "root", title: "Root", completed: false, children: [] }],
    });

    const view = await Home({ searchParams: { addChild: "missing-id" } });
    render(view);

    expect(screen.getByText("No encontramos el ítem al que querías agregar un hijo. Probá actualizar la página.")).toBeInTheDocument();
  });
});
