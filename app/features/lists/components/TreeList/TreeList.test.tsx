import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { VisibleNode } from "../../types";
import TreeList from "./TreeList";

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
    render(<TreeList nodes={[]} mode="pending" listId="list-1" />);
    expect(screen.getByText("No hay ítems para mostrar en esta vista.")).toBeInTheDocument();
  });

  test("en raíz pending abre borrador inline al recibir evento global de alta", () => {
    render(<TreeList nodes={[]} mode="pending" listId="list-1" />);
    act(() => {
      window.dispatchEvent(new CustomEvent("lists:add-root-draft", { detail: { listId: "list-1" } }));
    });

    const input = screen.getByPlaceholderText("Nuevo ítem");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  test("ignora evento global de alta cuando pertenece a otra lista", () => {
    render(<TreeList nodes={[]} mode="pending" listId="list-1" />);
    act(() => {
      window.dispatchEvent(new CustomEvent("lists:add-root-draft", { detail: { listId: "list-2" } }));
    });

    expect(screen.queryByPlaceholderText("Nuevo ítem")).not.toBeInTheDocument();
    expect(screen.getByText("No hay ítems para mostrar en esta vista.")).toBeInTheDocument();
  });

  test("si pierde foco fuera del borrador raíz, descarta el alta", async () => {
    render(<TreeList nodes={[]} mode="pending" listId="list-1" />);
    act(() => {
      window.dispatchEvent(new CustomEvent("lists:add-root-draft", { detail: { listId: "list-1" } }));
    });

    const input = screen.getByPlaceholderText("Nuevo ítem");
    fireEvent.change(input, { target: { value: "Nuevo root" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    fireEvent.blur(input);

    expect(screen.queryByPlaceholderText("Nuevo ítem")).not.toBeInTheDocument();
    expect(screen.getByText("No hay ítems para mostrar en esta vista.")).toBeInTheDocument();
  });

  test("con Enter en borrador raíz crea ítem y mantiene input para carga encadenada", () => {
    const onCreateItem = jest.fn();
    render(<TreeList nodes={[]} mode="pending" listId="list-1" onCreateItem={onCreateItem} />);

    act(() => {
      window.dispatchEvent(new CustomEvent("lists:add-root-draft", { detail: { listId: "list-1" } }));
    });

    const input = screen.getByPlaceholderText("Nuevo ítem");
    fireEvent.change(input, { target: { value: "Root encadenado" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateItem).toHaveBeenCalledWith("list-1", "Root encadenado");
    expect(screen.getByPlaceholderText("Nuevo ítem")).toBeInTheDocument();
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("con Enter en borrador raíz vacío descarta sin crear", () => {
    const onCreateItem = jest.fn();
    render(<TreeList nodes={[]} mode="pending" listId="list-1" onCreateItem={onCreateItem} />);

    act(() => {
      window.dispatchEvent(new CustomEvent("lists:add-root-draft", { detail: { listId: "list-1" } }));
    });

    const input = screen.getByPlaceholderText("Nuevo ítem");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateItem).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("Nuevo ítem")).not.toBeInTheDocument();
  });

  test("abre modal de completar cuando se clickea padre pendiente", () => {
    const parent = createNode({
      id: "parent",
      title: "Padre",
      completed: false,
      children: [createNode({ id: "child", title: "Hijo" })],
    });

    render(<TreeList nodes={[parent]} mode="pending" listId="list-1" />);
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

    render(<TreeList nodes={[parent]} mode="completed" listId="list-1" />);
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

    render(<TreeList nodes={[partialParent]} mode="completed" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Padre parcial"));

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.getByText("Desmarcar ítem padre")).toBeInTheDocument();
  });

  test("en nodos hoja dispara callback de toggle al cambiar checkbox", () => {
    const onToggleItem = jest.fn();
    const leaf = createNode({ id: "leaf", title: "Hoja", children: [] });

    render(<TreeList nodes={[leaf]} mode="pending" listId="list-1" onToggleItem={onToggleItem} />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Hoja"));

    expect(onToggleItem).toHaveBeenCalledTimes(1);
    expect(onToggleItem).toHaveBeenCalledWith("list-1", "leaf", true);
  });

  test("en un hijo hoja dentro de un parent no abre modal de parent", () => {
    const onToggleItem = jest.fn();
    const tree = createNode({
      id: "parent",
      title: "Padre",
      completed: false,
      children: [createNode({ id: "leaf-child", title: "Hoja hija", children: [] })],
    });

    render(<TreeList nodes={[tree]} mode="pending" listId="list-1" onToggleItem={onToggleItem} />);
    fireEvent.click(screen.getByLabelText("Cambiar estado de Hoja hija"));

    expect(onToggleItem).toHaveBeenCalledTimes(1);
    expect(onToggleItem).toHaveBeenCalledWith("list-1", "leaf-child", true);
    expect(screen.queryByText("Completar ítem padre")).not.toBeInTheDocument();
  });

  test("marca animación de completado cuando un ítem pasa a completado", () => {
    jest.useFakeTimers();
    try {
      const itemId = "anim-node";
      const initialNode = createNode({
        id: itemId,
        title: "Nodo animado",
        completed: false,
        children: [],
      });

      const { rerender } = render(<TreeList nodes={[initialNode]} mode="pending" listId="list-1" />);
      const initialCheckbox = screen.getByLabelText("Cambiar estado de Nodo animado");
      expect(initialCheckbox.closest("[data-completion-animating]")).toHaveAttribute(
        "data-completion-animating",
        "false"
      );
      expect(screen.queryByTestId(`completion-presence-${itemId}`)).not.toBeInTheDocument();

      const completedNode = createNode({
        id: itemId,
        title: "Nodo animado",
        completed: true,
        children: [],
      });
      rerender(<TreeList nodes={[completedNode]} mode="pending" listId="list-1" />);

      const completedCheckbox = screen.getByLabelText("Cambiar estado de Nodo animado");
      expect(completedCheckbox.closest("[data-completion-animating]")).toHaveAttribute(
        "data-completion-animating",
        "true"
      );
      expect(screen.getByTestId(`completion-presence-${itemId}`)).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1200);
      });

      expect(completedCheckbox.closest("[data-completion-animating]")).toHaveAttribute(
        "data-completion-animating",
        "false"
      );
      const finalPresence = screen.queryByTestId(`completion-presence-${itemId}`);
      if (finalPresence) {
        expect(finalPresence).toHaveStyle({ opacity: "0" });
      }
    } finally {
      jest.useRealTimers();
    }
  });

  test("al clickear + abre edición inline de nuevo hijo sin dialog", () => {
    const parent = createNode({ id: "parent-add", title: "Padre para hijo", children: [] });

    render(<TreeList nodes={[parent]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Agregar hijo a Padre para hijo"));

    const input = screen.getByPlaceholderText("Nuevo hijo");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("si pierde foco fuera del borrador de hijo, descarta el alta", async () => {
    const parent = createNode({ id: "parent-discard", title: "Padre descartar", children: [] });

    render(<TreeList nodes={[parent]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Agregar hijo a Padre descartar"));

    const input = screen.getByPlaceholderText("Nuevo hijo");
    fireEvent.change(input, { target: { value: "Hijo temporal" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    fireEvent.blur(input);

    expect(screen.queryByPlaceholderText("Nuevo hijo")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Hijo temporal")).not.toBeInTheDocument();
  });

  test("abre dialog de eliminación para ítem hoja", () => {
    const leaf = createNode({ id: "leaf-delete", title: "Hoja para borrar", children: [] });

    render(<TreeList nodes={[leaf]} mode="pending" listId="list-1" />);
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

    render(<TreeList nodes={[parent]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Parent para borrar"));
    fireEvent.click(screen.getByLabelText("Eliminar Parent para borrar"));

    expect(screen.getByRole("heading", { name: "Eliminar ítem" })).toBeInTheDocument();
    expect(screen.getByText(/también se eliminarán todos sus descendientes/)).toBeInTheDocument();
  });

  test("permite editar inline desde el dropdown y muestra input con Guardar", () => {
    const node = createNode({ id: "edit-node", title: "Título original", children: [] });

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Título original"));
    fireEvent.click(screen.getByLabelText("Editar Título original"));

    const input = screen.getByDisplayValue("Título original");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  test("permite editar inline al clickear el nombre del ítem", () => {
    const node = createNode({ id: "edit-click", title: "Editar al click", children: [] });

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByText("Editar al click"));

    expect(screen.getByDisplayValue("Editar al click")).toBeInTheDocument();
  });

  test("deshabilita los tres puntos mientras hay edición inline activa", () => {
    const nodeA = createNode({ id: "edit-a", title: "Ítem A", children: [] });
    const nodeB = createNode({ id: "edit-b", title: "Ítem B", children: [] });

    render(<TreeList nodes={[nodeA, nodeB]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Ítem A"));
    fireEvent.click(screen.getByLabelText("Editar Ítem A"));

    expect(screen.queryByLabelText("Abrir acciones de Ítem A")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Abrir acciones de Ítem B")).toBeDisabled();
  });

  test("si pierde foco fuera del input group y el título no está vacío, envía guardado", async () => {
    const node = createNode({ id: "edit-cancel", title: "Texto base", children: [] });
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Texto base"));
    fireEvent.click(screen.getByLabelText("Editar Texto base"));

    const input = screen.getByDisplayValue("Texto base");
    fireEvent.change(input, { target: { value: "Texto modificado" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    fireEvent.blur(input);

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    requestSubmitSpy.mockRestore();
  });

  test("con Enter y título no vacío envía guardado", () => {
    const node = createNode({ id: "edit-enter", title: "Texto enter", children: [] });
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Texto enter"));
    fireEvent.click(screen.getByLabelText("Editar Texto enter"));

    const input = screen.getByDisplayValue("Texto enter");
    fireEvent.change(input, { target: { value: "Texto enter actualizado" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    requestSubmitSpy.mockRestore();
  });

  test("con Enter y título vacío descarta edición sin guardar", () => {
    const node = createNode({ id: "edit-empty-enter", title: "Texto vacío", children: [] });
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Texto vacío"));
    fireEvent.click(screen.getByLabelText("Editar Texto vacío"));

    const input = screen.getByDisplayValue("Texto vacío");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(requestSubmitSpy).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("")).not.toBeInTheDocument();
    expect(screen.getByText("Texto vacío")).toBeInTheDocument();
    requestSubmitSpy.mockRestore();
  });

  test("si pierde foco con título vacío descarta edición sin guardar", async () => {
    const node = createNode({ id: "edit-empty-blur", title: "Texto blur vacío", children: [] });
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(<TreeList nodes={[node]} mode="pending" listId="list-1" />);
    fireEvent.click(screen.getByLabelText("Abrir acciones de Texto blur vacío"));
    fireEvent.click(screen.getByLabelText("Editar Texto blur vacío"));

    const input = screen.getByDisplayValue("Texto blur vacío");
    fireEvent.change(input, { target: { value: "" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    fireEvent.blur(input);

    expect(requestSubmitSpy).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("")).not.toBeInTheDocument();
    expect(screen.getByText("Texto blur vacío")).toBeInTheDocument();
    requestSubmitSpy.mockRestore();
  });
});
