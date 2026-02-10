import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { VisibleNode } from "../../types";
import CompletedItemsDialog from "./CompletedItemsDialog";

jest.mock("../TreeList/TreeList", () => ({
  __esModule: true,
  default: ({ nodes, mode }: { nodes: VisibleNode[]; mode: string }) => (
    <div data-testid="completed-tree-list">
      mode:{mode} count:{nodes.length}
    </div>
  ),
}));

jest.mock("../Link/Link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
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
      />,
    );

    expect(screen.queryByText("Completados")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));

    expect(screen.getByText("Completados")).toBeInTheDocument();
    expect(screen.getByText("Tenés 1 ítems completados.")).toBeInTheDocument();
    expect(screen.getByTestId("completed-tree-list")).toHaveTextContent("mode:completed");
    expect(screen.getByTestId("completed-tree-list")).toHaveTextContent("count:1");
  });

  test("muestra link para desmarcar completados cuando corresponde", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={1}
        canResetCompleted
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.getByRole("link", { name: "Desmarcar completados" })).toHaveAttribute(
      "href",
      "/?confirmReset=true",
    );
  });

  test("no muestra link para desmarcar completados cuando no corresponde", () => {
    render(
      <CompletedItemsDialog
        nodes={[createNode()]}
        completedCount={0}
        canResetCompleted={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver completados" }));
    expect(screen.queryByRole("link", { name: "Desmarcar completados" })).not.toBeInTheDocument();
  });
});
