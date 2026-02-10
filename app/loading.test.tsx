import { render, screen } from "@testing-library/react";
import Loading from "./loading";

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

describe("Loading page", () => {
  test("muestra mensaje de carga", () => {
    render(<Loading />);
    expect(screen.getByText("Cargando listas...")).toBeInTheDocument();
  });
});
