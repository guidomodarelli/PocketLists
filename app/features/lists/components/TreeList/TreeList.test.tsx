import { fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { VisibleNode } from "../../types";
import TreeList from "./TreeList";

jest.mock("../../actions", () => ({
  confirmParentAction: jest.fn(),
  confirmUncheckParentAction: jest.fn(),
  deleteItemAction: jest.fn(),
  toggleItemAction: jest.fn(),
}));

jest.mock("../Link/Link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    disabled,
    ...props
  }: {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (value: boolean | "indeterminate") => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      disabled={disabled}
      data-state={String(checked)}
      onClick={() => onCheckedChange?.(checked === true ? false : true)}
      {...props}
    />
  ),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children, asChild }: { children: ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
    ...props
  }: {
    children: ReactNode;
    onSelect?: (event: Event & { preventDefault: () => void }) => void;
    [key: string]: unknown;
  }) => (
    <button
      type="button"
      {...props}
      onClick={() =>
        onSelect?.({
          preventDefault: () => undefined,
        } as Event & { preventDefault: () => void })}
    >
      {children}
    </button>
  ),
}));

function createNode(overrides: Partial<VisibleNode> = {}): VisibleNode {
  return {
    id: "node-1",
    title: "Nodo",
    completed: false,
    isPartiallyCompleted: false,
    isContextOnly: false,
    children: [],
    ...overrides,
  };
}

describe("TreeList", () => {
  test("muestra mensaje vacío en raíz sin nodos", () => {
    render(<TreeList nodes={[]} mode="pending" />);
    expect(screen.getByText("No hay ítems para mostrar en esta vista.")).toBeInTheDocument();
  });

  test("abre modal de completar cuando se clickea padre pendiente", () => {
    const parent = createNode({
      id: "parent",
      title: "Padre",
      completed: false,
      children: [createNode({ id: "child", title: "Hijo" })],
    });

    render(<TreeList nodes={[parent]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Padre"));

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.getByText("Completar ítem padre")).toBeInTheDocument();
    expect(screen.getByText(/Vas a completar/)).toBeInTheDocument();
  });

  test("abre modal de desmarcar cuando se clickea padre en lista completed", () => {
    const parent = createNode({
      id: "parent-completed",
      title: "Padre completo",
      completed: true,
      children: [createNode({ id: "child", title: "Hijo", completed: true })],
    });

    render(<TreeList nodes={[parent]} mode="completed" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Padre completo"));

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.getByText("Desmarcar ítem padre")).toBeInTheDocument();
    expect(screen.getByText(/Vas a desmarcar/)).toBeInTheDocument();
  });

  test("abre modal de desmarcar para parent parcialmente completado en completed", () => {
    const partialParent = createNode({
      id: "parent-partial",
      title: "Padre parcial",
      completed: false,
      isPartiallyCompleted: true,
      isContextOnly: true,
      children: [createNode({ id: "child-completed", title: "Hijo", completed: true })],
    });

    render(<TreeList nodes={[partialParent]} mode="completed" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Padre parcial"));

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.getByText("Desmarcar ítem padre")).toBeInTheDocument();
  });

  test("en nodos hoja envía form al cambiar checkbox", () => {
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");
    const leaf = createNode({ id: "leaf", title: "Hoja", children: [] });

    render(<TreeList nodes={[leaf]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Hoja"));

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    requestSubmitSpy.mockRestore();
  });

  test("en un hijo hoja dentro de un parent no abre modal de parent", () => {
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");
    const tree = createNode({
      id: "parent",
      title: "Padre",
      completed: false,
      children: [createNode({ id: "leaf-child", title: "Hoja hija", children: [] })],
    });

    render(<TreeList nodes={[tree]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Hoja hija"));

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Completar ítem padre")).not.toBeInTheDocument();
    requestSubmitSpy.mockRestore();
  });

  test("abre dialog de eliminación para ítem hoja", () => {
    const leaf = createNode({ id: "leaf-delete", title: "Hoja para borrar", children: [] });

    render(<TreeList nodes={[leaf]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Hoja para borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar Hoja para borrar"));

    expect(screen.getByRole("heading", { name: "Eliminar ítem" })).toBeInTheDocument();
    expect(screen.getByText(/Se eliminará el ítem/)).toBeInTheDocument();
  });

  test("abre dialog de eliminación para parent y aclara descendientes", () => {
    const parent = createNode({
      id: "parent-delete",
      title: "Parent para borrar",
      children: [createNode({ id: "child", title: "Child" })],
    });

    render(<TreeList nodes={[parent]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Parent para borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar Parent para borrar"));

    expect(screen.getByRole("heading", { name: "Eliminar ítem" })).toBeInTheDocument();
    expect(screen.getByText(/también se eliminarán todos sus descendientes/)).toBeInTheDocument();
  });
});
