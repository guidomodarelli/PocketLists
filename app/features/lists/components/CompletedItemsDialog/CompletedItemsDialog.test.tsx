import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { MouseEvent, ReactNode } from "react";
import type { VisibleNode } from "../../types";
import CompletedItemsDialog from "./CompletedItemsDialog";

jest.mock("../TreeList/TreeList", () => ({
  __esModule: true,
  default: ({ nodes, mode, listId }: { nodes: VisibleNode[]; mode: string; listId: string }) => (
    <div data-testid="completed-tree-list">
      mode:{mode} count:{nodes.length} list:{listId}
    </div>
  ),
}));

jest.mock("../Link/Link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

function createNode(overrides: Partial<VisibleNode> = {}): VisibleNode {
  return {
    id: "node-1",
    title: "Nodo",
    completed: true,
    isPartiallyCompleted: false,
    isContextOnly: false,
    children: [],
    ...overrides,
  };
}

describe("CompletedItemsDialog", () => {
  test("abre el dialog al clickear Ver completados y muestra contenido", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
      />,
    );

    expect(screen.queryByText("Completados")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));

    expect(screen.getByText("Completados")).toBeInTheDocument();
    expect(screen.getByText("Tenés 1 ítems completados.")).toBeInTheDocument();
    expect(screen.getByTestId("completed-tree-list")).toHaveTextContent("mode:completed");
    expect(screen.getByTestId("completed-tree-list")).toHaveTextContent("count:1");
    expect(screen.getByTestId("completed-tree-list")).toHaveTextContent("list:list-1");
  });

  test("muestra link para desmarcar completados cuando corresponde", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.getByRole("link", { name: "Desmarcar completados" })).toHaveAttribute(
      "href",
      "/lists/list-1?confirmReset=true",
    );
  });

  test("mantiene abierto el dialog cuando se clickea Desmarcar completados", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.getByText("Completados")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Desmarcar completados" }));

    expect(screen.getByText("Completados")).toBeInTheDocument();
  });

  test("cierra el dialog cuando ya no hay ítems completados y permite volver a abrirlo", async () => {
    const { rerender } = render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.getByText("Completados")).toBeInTheDocument();

    rerender(
      <CompletedItemsDialog
        nodes={[]}
        completedCount={0}
        canResetCompleted={false}
        listId="list-1"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Completados")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));

    expect(screen.getByText("Completados")).toBeInTheDocument();
    expect(screen.getByText("Tenés 0 ítems completados.")).toBeInTheDocument();
  });

  test("no muestra link para desmarcar completados cuando no corresponde", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={0}
        canResetCompleted={false}
        listId="list-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.queryByRole("link", { name: "Desmarcar completados" })).not.toBeInTheDocument();
  });
});
