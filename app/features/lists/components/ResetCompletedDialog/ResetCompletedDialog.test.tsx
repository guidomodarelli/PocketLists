import { fireEvent, render, screen } from "@testing-library/react";
import ResetCompletedDialog from "./ResetCompletedDialog";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => (
    <div data-testid="dialog" data-open={open === undefined ? "undefined" : String(open)}>
      <button type="button" onClick={() => onOpenChange?.(false)}>
        close-dialog
      </button>
      <button type="button" onClick={() => onOpenChange?.(true)}>
        keep-open
      </button>
      {children}
    </div>
  ),
}));

describe("ResetCompletedDialog", () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  test("renderiza contenido cuando está abierto", () => {
    render(
      <ResetCompletedDialog open dismissHref="/lists/list-1">
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "true");
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  test("limpia query params al cerrar el modal", () => {
    render(
      <ResetCompletedDialog open dismissHref="/lists/list-1">
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "close-dialog" }));

    expect(replaceMock).toHaveBeenCalledWith("/lists/list-1", { scroll: false });
  });

  test("no navega cuando el modal sigue abierto", () => {
    render(
      <ResetCompletedDialog open dismissHref="/lists/list-1">
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "keep-open" }));

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
