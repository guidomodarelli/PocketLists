import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import ListsSidebar from "./ListsSidebar";

const pushMock = jest.fn();

jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    asPath: "/lists/list-2",
    push: pushMock,
  })),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
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

jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <li>{children}</li>,
  SidebarMenuAction: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => {
    const showOnHover = Boolean(props.showOnHover);
    const buttonProps = { ...props };
    delete buttonProps.showOnHover;
    return (
      <button type="button" data-show-on-hover={String(showOnHover)} {...buttonProps}>
        {children}
      </button>
    );
  },
  SidebarMenuButton: ({
    children,
    isActive,
  }: {
    children: ReactNode;
    isActive?: boolean;
  }) => <div data-active={String(Boolean(isActive))}>{children}</div>,
  SidebarTrigger: ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      Toggle Sidebar
    </button>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
}));

describe("ListsSidebar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    pushMock.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("renderiza navegación de listas y botón para crear nueva lista en el encabezado", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    const firstListLink = screen.getByRole("link", { name: "Lista 1" });
    const secondListLink = screen.getByRole("link", { name: "Lista 2" });
    const newListButton = screen.getByRole("button", { name: "Nueva lista" });

    expect(firstListLink).toHaveAttribute("href", "/lists/list-1");
    expect(secondListLink).toHaveAttribute("href", "/lists/list-2");
    expect(screen.getByText("Listas")).toBeInTheDocument();
    expect(newListButton).toHaveAttribute("data-variant", "ghost");
    expect(newListButton).toHaveAttribute("data-size", "xs");
    expect(
      Boolean(newListButton.compareDocumentPosition(firstListLink) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);
    const actionsButton = screen.getByRole("button", { name: "Abrir acciones de Lista 1" });
    expect(actionsButton).toBeInTheDocument();
    expect(actionsButton).toHaveAttribute("data-show-on-hover", "true");
  });

  test("renderiza botón para colapsar o expandir sidebar en desktop", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    const collapseButton = screen.getByRole("button", { name: "Colapsar o expandir sidebar" });
    expect(collapseButton).toBeInTheDocument();
    expect(collapseButton).toHaveAttribute("title", "Colapsar o expandir sidebar");
  });

  test("incluye abreviatura del nombre para estado colapsado", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    expect(screen.getByText("PL")).toBeInTheDocument();
  });

  test("muestra placeholder cuando la lista no tiene nombre", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-empty", title: "" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    expect(screen.getByText("(Sin nombre)")).toBeInTheDocument();
  });

  test("marca como activa la lista de la ruta actual", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    const list1Trigger = screen.getByText("Lista 1").closest("[data-active]");
    const list2Trigger = screen.getByText("Lista 2").closest("[data-active]");

    expect(list1Trigger).toHaveAttribute("data-active", "false");
    expect(list2Trigger).toHaveAttribute("data-active", "true");
  });

  test("single click navega a la lista seleccionada", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lista 1" }));
    expect(pushMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(pushMock).toHaveBeenCalledWith("/lists/list-1", undefined, { shallow: true });
  });

  test("single click en placeholder navega a la lista", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-empty", title: "" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "(Sin nombre)" }));
    expect(pushMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(pushMock).toHaveBeenCalledWith("/lists/list-empty", undefined, { shallow: true });
  });

  test("doble click abre edición inline y no navega", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.doubleClick(screen.getByRole("button", { name: "Lista 1" }));
    expect(screen.getByLabelText("Editar nombre de Lista 1")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  test("doble click en placeholder abre edición inline", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-empty", title: "" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.doubleClick(screen.getByRole("button", { name: "(Sin nombre)" }));
    expect(screen.getByLabelText("Editar nombre de (Sin nombre)")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  test("permite editar inline el nombre de una lista desde el sidebar", () => {
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.doubleClick(screen.getByRole("button", { name: "Lista 1" }));
    const input = screen.getByLabelText("Editar nombre de Lista 1");
    fireEvent.change(input, { target: { value: "Lista actualizada" } });
    fireEvent.blur(input);

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    requestSubmitSpy.mockRestore();
  });

  test("abre edición desde el menú de acciones", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText("Editar Lista 1"));
    expect(screen.getByLabelText("Editar nombre de Lista 1")).toBeInTheDocument();
  });

  test("eliminar lista abre confirmación y recién envía al confirmar", () => {
    const onDeleteList = jest.fn();

    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
        onDeleteList={onDeleteList}
      />
    );

    fireEvent.click(screen.getByLabelText("Eliminar Lista 1"));
    expect(screen.getByText("¿Eliminar lista?")).toBeInTheDocument();
    expect(screen.getByText('Esta acción eliminará "Lista 1" de forma permanente.')).toBeInTheDocument();
    expect(onDeleteList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("¿Eliminar lista?")).not.toBeInTheDocument();
    expect(onDeleteList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Eliminar Lista 1"));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onDeleteList).toHaveBeenCalledTimes(1);
    expect(onDeleteList).toHaveBeenCalledWith("list-1", "list-2");
  });

  test("cancela la edición con Esc y no guarda cambios", () => {
    const requestSubmitSpy = jest.spyOn(HTMLFormElement.prototype, "requestSubmit");

    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    fireEvent.doubleClick(screen.getByRole("button", { name: "Lista 1" }));
    const input = screen.getByLabelText("Editar nombre de Lista 1");
    fireEvent.change(input, { target: { value: "Lista temporal" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByLabelText("Editar nombre de Lista 1")).not.toBeInTheDocument();
    expect(screen.getByText("Lista 1")).toBeInTheDocument();
    expect(requestSubmitSpy).not.toHaveBeenCalled();
    requestSubmitSpy.mockRestore();
  });
});
