import { fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

const originalNodeEnv = process.env.NODE_ENV;

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("renderiza en modo dark por defecto y permite alternar a light", () => {
    render(<ThemeToggle />);

    const wrapper = screen.getByTestId("theme-toggle");
    const button = screen.getByRole("button", { name: "Activar modo claro" });

    expect(wrapper.className).toContain("theme-toggle");
    expect(document.documentElement).toHaveClass("dark");

    fireEvent.click(button);

    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Activar modo oscuro" })).toBeInTheDocument();
  });

  test("persiste el tema seleccionado en localStorage", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Activar modo claro" }));
    expect(window.localStorage.getItem("theme")).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: "Activar modo oscuro" }));
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  test("respeta el tema guardado cuando existe en localStorage", () => {
    window.localStorage.setItem("theme", "light");
    document.documentElement.classList.add("dark");

    render(<ThemeToggle />);

    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Activar modo oscuro" })).toBeInTheDocument();
  });

  test("muestra badge de desarrollo cuando NODE_ENV es development", () => {
    process.env.NODE_ENV = "development";

    render(<ThemeToggle />);

    expect(screen.getByText("DEV")).toBeInTheDocument();
  });

  test("no muestra badge de desarrollo cuando NODE_ENV es production", () => {
    process.env.NODE_ENV = "production";

    render(<ThemeToggle />);

    expect(screen.queryByText("DEV")).not.toBeInTheDocument();
  });
});
