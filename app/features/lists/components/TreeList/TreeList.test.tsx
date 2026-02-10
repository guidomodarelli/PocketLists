import { fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { VisibleNode } from "../../types";
import TreeList from "./TreeList";

jest.mock("../../actions", () => ({
  confirmParentAction: jest.fn(),
  confirmUncheckParentAction: jest.fn(),
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

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: ReactNode }) => <button>{children}</button>,
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

  test("en nodos hoja envía form al cambiar checkbox", () => {
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");
    const leaf = createNode({ id: "leaf", title: "Hoja", children: [] });

    render(<TreeList nodes={[leaf]} mode="pending" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Hoja"));

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    requestSubmitSpy.mockRestore();
  });
});
