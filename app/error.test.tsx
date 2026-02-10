import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "./error";

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

describe("Error page", () => {
  test("muestra contenido de error y permite reintentar", () => {
    const reset = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    render(<ErrorPage error={new Error("Boom")} reset={reset} />);

    expect(consoleSpy).toHaveBeenCalled();
    expect(screen.getByText("Ocurrió un error al cargar las listas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
