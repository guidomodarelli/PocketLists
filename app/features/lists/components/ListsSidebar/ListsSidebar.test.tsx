import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import ListsSidebar from "./ListsSidebar";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/lists/list-2"),
  useRouter: jest.fn(() => ({ push: pushMock })),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock("../../actions", () => ({
  createListAction: jest.fn(),
  editListTitleAction: jest.fn(),
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
  SidebarMenuButton: ({
    children,
    isActive,
  }: {
    children: ReactNode;
    isActive?: boolean;
  }) => <div data-active={String(Boolean(isActive))}>{children}</div>,
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

  test("renderiza navegación de listas y botón para crear nueva lista", () => {
    render(
      <ListsSidebar
        lists={[
          { id: "list-1", title: "Lista 1" },
          { id: "list-2", title: "Lista 2" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Lista 1" })).toHaveAttribute("href", "/lists/list-1");
    expect(screen.getByRole("link", { name: "Lista 2" })).toHaveAttribute("href", "/lists/list-2");
    expect(screen.getByRole("button", { name: "Nueva lista" })).toBeInTheDocument();
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

    expect(pushMock).toHaveBeenCalledWith("/lists/list-1");
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

    expect(pushMock).toHaveBeenCalledWith("/lists/list-empty");
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
