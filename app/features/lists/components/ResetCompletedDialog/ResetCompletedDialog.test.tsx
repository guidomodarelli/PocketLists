import { fireEvent, render, screen } from "@testing-library/react";
import ResetCompletedDialog from "./ResetCompletedDialog";

const onOpenChangeMock = jest.fn();

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
    onOpenChangeMock.mockClear();
  });

  test("renderiza contenido cuando está abierto", () => {
    render(
      <ResetCompletedDialog open onOpenChange={onOpenChangeMock}>
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "true");
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  test("notifica close al cerrar el modal", () => {
    render(
      <ResetCompletedDialog open onOpenChange={onOpenChangeMock}>
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "close-dialog" }));

    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });

  test("propaga cambios cuando el modal sigue abierto", () => {
    render(
      <ResetCompletedDialog open onOpenChange={onOpenChangeMock}>
        <div>Modal content</div>
      </ResetCompletedDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "keep-open" }));

    expect(onOpenChangeMock).toHaveBeenCalledWith(true);
  });
});
