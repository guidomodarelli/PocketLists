import { fireEvent, render, screen } from "@testing-library/react";
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

  test("muestra botón para desmarcar completados cuando corresponde", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.getByRole("button", { name: "Desmarcar completados" })).toBeInTheDocument();
  });

  test("notifica callback al clickear Desmarcar completados", () => {
    const onRequestResetCompleted = jest.fn();

    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
        onRequestResetCompleted={onRequestResetCompleted}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    fireEvent.click(screen.getByRole("button", { name: "Desmarcar completados" }));

    expect(onRequestResetCompleted).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Completados")).toBeInTheDocument();
  });

  test("permite controlar apertura y cierre desde el padre", () => {
    const { rerender } = render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
        open
      />,
    );

    expect(screen.getByText("Completados")).toBeInTheDocument();

    rerender(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
        listId="list-1"
        open={false}
      />,
    );

    expect(screen.queryByText("Completados")).not.toBeInTheDocument();
  });

  test("actualiza contenido cuando cambian los completados", () => {
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

    expect(screen.getByText("Completados")).toBeInTheDocument();
    expect(screen.getByText("Tenés 0 ítems completados.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desmarcar completados" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Desmarcar completados" })).not.toBeInTheDocument();
  });
});
