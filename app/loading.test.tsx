import { render, screen } from "@testing-library/react";
import Loading from "./loading";

describe("Loading page", () => {
  test("muestra el loader de carga", () => {
    render(<Loading />);
    const loader = screen.getByRole("status", { name: "Cargando listas" });
    expect(loader).toBeInTheDocument();
    expect(loader.parentElement).toHaveClass("loading-page");
    expect(loader.parentElement).not.toHaveClass("loading-page__card");
  });
});
