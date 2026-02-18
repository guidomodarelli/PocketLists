import { fireEvent, render, screen } from "@testing-library/react";
import type { GetServerSidePropsContext } from "next";
import React, { type ReactNode } from "react";
import ListPage, { getServerSideProps } from "@/pages/lists/[listId]";
import * as services from "@/app/features/lists/services";
import { useActiveListQuery } from "@/app/features/lists/hooks/useListsQuery";
import { useListsMutations } from "@/app/features/lists/hooks/useListsMutations";
import type { List, ListSummary } from "@/app/features/lists/types";

const pushMock = jest.fn();
const routerQueryState: { current: Record<string, string | string[] | undefined> } = {
  current: {},
};
let treeListMountCounter = 0;

jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({ push: pushMock, query: routerQueryState.current, isReady: true })),
}));

jest.mock("@/app/features/lists/services", () => ({
  getListById: jest.fn(),
  getListSummaries: jest.fn(),
}));

jest.mock("@/app/features/lists/hooks/useListsQuery", () => ({
  useActiveListQuery: jest.fn(),
}));

jest.mock("@/app/features/lists/hooks/useListsMutations", () => ({
  useListsMutations: jest.fn(),
}));

jest.mock("@/app/features/lists/components/ListsSidebar/ListsSidebar", () => ({
  __esModule: true,
  default: ({ lists }: { lists: ListSummary[] }) => (
    <aside data-testid="lists-sidebar">{lists.map((list) => list.title).join(",")}</aside>
  ),
}));

jest.mock("@/app/features/lists/components/TreeList/TreeList", () => ({
  __esModule: true,
  default: class MockTreeList extends React.Component<
    { mode: string; nodes: Array<{ id: string }>; listId: string },
    { draftCounter: number }
  > {
    private readonly mountId: string;

    constructor(props: { mode: string; nodes: Array<{ id: string }>; listId: string }) {
      super(props);
      treeListMountCounter += 1;
      this.mountId = `mount-${treeListMountCounter}`;
      this.state = { draftCounter: 0 };
    }

    render() {
      const { mode, nodes, listId } = this.props;

      return (
        <div data-testid={`tree-list-${mode}`} data-mount-id={this.mountId}>
          nodes:{nodes.length} list:{listId}
          <button
            type="button"
            onClick={() => this.setState((current) => ({ draftCounter: current.draftCounter + 1 }))}
          >
            preserve-{mode}-draft
          </button>
          <span data-testid={`tree-list-${mode}-draft-counter`}>{this.state.draftCounter}</span>
        </div>
      );
    }
  },
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
    onRequestResetCompleted,
    open,
    onOpenChange,
  }: {
    completedCount: number;
    listId: string;
    onRequestResetCompleted?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="completed-items-dialog" data-open={String(open ?? false)}>
      completed:{completedCount} list:{listId}
      <button type="button" onClick={() => onOpenChange?.(true)}>
        open-completed-modal
      </button>
      <button type="button" onClick={onRequestResetCompleted}>
        open-reset-modal
      </button>
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
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
  }) => (
    <div
      data-testid="reset-completed-dialog"
      data-open={String(open)}
    >
      <button type="button" onClick={() => onOpenChange?.(false)}>
        close-reset-modal
      </button>
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
const useActiveListQueryMock = jest.mocked(useActiveListQuery);
const useListsMutationsMock = jest.mocked(useListsMutations);

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
    pushMock.mockReset();
    routerQueryState.current = {};
    useActiveListQueryMock.mockImplementation((_listId, options) => ({
      data: options.initialActiveList
        ? {
            lists: options.listsFallback,
            activeList: options.initialActiveList,
          }
        : undefined,
    }) as never);
    useListsMutationsMock.mockReturnValue({
      mutateAction: jest.fn(),
      isMutating: false,
      pendingAction: undefined,
    } as never);
  });

  test("getServerSideProps obtiene datos de la lista y estado del sidebar", async () => {
    servicesMock.getListSummaries.mockResolvedValue([{ id: "list-1", title: "Lista 1" }]);
    servicesMock.getListById.mockResolvedValue({
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
    servicesMock.getListSummaries.mockResolvedValue([{ id: "list-2", title: "Lista 2" }]);
    servicesMock.getListById.mockResolvedValue(undefined);

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

  test("conserva estado local del TreeList al pasar de vacía a primer ítem", () => {
    const queryState = {
      current: {
        lists: [{ id: "list-1", title: "Lista 1" }],
        activeList: {
          id: "list-1",
          title: "Lista 1",
          items: [] as Array<{ id: string; title: string; completed: boolean; children: [] }>,
        },
      },
    };

    useActiveListQueryMock.mockImplementation(
      () =>
        ({
          data: queryState.current,
        }) as never
    );

    const props = createPageProps({
      activeList: {
        id: "list-1",
        title: "Lista 1",
        items: [],
      },
    });

    const { rerender } = render(<ListPage {...props} />);

    const pendingTree = screen.getByTestId("tree-list-pending");
    const initialMountId = pendingTree.getAttribute("data-mount-id");
    expect(initialMountId).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "preserve-pending-draft" }));
    expect(screen.getByTestId("tree-list-pending-draft-counter")).toHaveTextContent("1");

    queryState.current = {
      ...queryState.current,
      activeList: {
        ...queryState.current.activeList,
        items: [{ id: "item-1", title: "Primer ítem", completed: false, children: [] }],
      },
    };

    rerender(<ListPage {...props} />);

    expect(screen.getByTestId("tree-list-pending-draft-counter")).toHaveTextContent("1");
    expect(screen.getByTestId("tree-list-pending")).toHaveAttribute("data-mount-id", initialMountId ?? "");
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
  });

  test("ignora query openCompleted para la apertura del modal de completados", () => {
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

    expect(screen.getByTestId("completed-items-dialog")).toBeInTheDocument();
  });

  test("usa la query actual del router para resolver error banner", () => {
    routerQueryState.current = { listId: "list-1" };

    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "pending-1", title: "Pendiente", completed: false, children: [] }],
          },
          searchParams: { error: "add" },
        })}
      />
    );

    expect(screen.queryByText("No pudimos agregar el ítem.")).not.toBeInTheDocument();
  });

  test("muestra modal de confirmación reset al solicitarlo desde el cliente", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
          },
        })}
      />
    );

    expect(screen.queryByTestId("reset-completed-dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "open-reset-modal" }));

    expect(screen.getByRole("heading", { name: "Desmarcar completados" })).toBeInTheDocument();
    expect(screen.getByText("Vas a desmarcar todos los ítems completados. ¿Querés continuar?")).toBeInTheDocument();
    expect(screen.getByTestId("reset-completed-dialog")).toHaveAttribute("data-open", "true");
  });

  test("permite cerrar modal de confirmación reset en cliente", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
          },
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "open-reset-modal" }));
    expect(screen.getByTestId("reset-completed-dialog")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "close-reset-modal" }));
    expect(screen.queryByTestId("reset-completed-dialog")).not.toBeInTheDocument();
  });

  test("solo cierra completados al confirmar desmarcado", () => {
    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "completed-1", title: "Completado", completed: true, children: [] }],
          },
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "open-completed-modal" }));
    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "open-reset-modal" }));
    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "close-reset-modal" }));
    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "open-reset-modal" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y desmarcar" }));
    expect(screen.getByTestId("completed-items-dialog")).toHaveAttribute("data-open", "false");
  });

  test("muestra banner cuando confirm apunta a un ítem inexistente", () => {
    routerQueryState.current = { listId: "list-1", confirm: "missing-id" };

    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "root", title: "Root", completed: false, children: [] }],
          },
          searchParams: {},
        })}
      />
    );

    expect(screen.getByText("No encontramos el ítem que querías confirmar. Probá actualizar la página.")).toBeInTheDocument();
  });

  test("con Enter global dispara evento para abrir borrador raíz", () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "pending-1", title: "Pendiente", completed: false, children: [] }],
          },
        })}
      />
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "lists:add-root-draft",
      })
    );

    dispatchEventSpy.mockRestore();
  });

  test("ignora Enter global cuando el foco está en un input editable", () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    const editableInput = document.createElement("input");
    document.body.appendChild(editableInput);

    render(
      <ListPage
        {...createPageProps({
          activeList: {
            id: "list-1",
            title: "Lista 1",
            items: [{ id: "pending-1", title: "Pendiente", completed: false, children: [] }],
          },
        })}
      />
    );

    editableInput.focus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(dispatchEventSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "lists:add-root-draft",
      })
    );

    editableInput.remove();
    dispatchEventSpy.mockRestore();
  });
});
